// Server-only CV lifecycle: encrypt original bytes and extraction metadata with record-bound keys.
import "server-only";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { physicianDocuments, physicians } from "@/lib/db/clinical";
import { clinicalActor, clinicalEvent } from "@/features/clinical/access";
import { seal, unseal } from "@/features/clinical/encryption";
import { cvObject } from "@/features/physicians/cv-storage";
import { cvType } from "@/features/physicians/cv-validation";
import { CLINICAL_POLICY } from "@/config/clinical";
const metadataSchema = z.object({ name: z.string().min(1).max(255), type: z.string().max(100), text: z.string().max(CLINICAL_POLICY.cvCharacters) }).strict();
export async function saveDocument(physicianId: string, file: File, text: string) {
  if (!z.uuid().safeParse(physicianId).success || file.size > CLINICAL_POLICY.cvBytes) return { ok: false as const, code: "invalid" as const };
  return db().transaction(async tx => {
    const actor = await clinicalActor(tx, "physicians:manage"); if (!actor) return { ok: false as const, code: "denied" as const };
    const [provider] = await tx.select({ id: physicians.id }).from(physicians).where(and(eq(physicians.id, physicianId), eq(physicians.organisationId, actor.organisationId)));
    if (!provider) return { ok: false as const, code: "denied" as const };
    const bytes = new Uint8Array(await file.arrayBuffer()); const type = cvType(bytes); if (!type) return { ok: false as const, code: "invalid" as const };
    const metadata = metadataSchema.parse({ name: file.name, type, text });
    const id = randomUUID(); const objectPath = `${actor.organisationId}/${id}.enc`;
    await cvObject(objectPath, "POST", Buffer.from(seal(Buffer.from(bytes).toString("base64"), actor.organisationId, id, "cv")));
    try {
      await tx.insert(physicianDocuments).values({ id, organisationId: actor.organisationId, physicianId, objectPath, metadata: seal(JSON.stringify(metadata), actor.organisationId, id, "cv-metadata") });
    } catch (error) { await cvObject(objectPath, "DELETE").catch(() => undefined); throw error; }
    await clinicalEvent(tx, actor.organisationId, "physicians.cv_uploaded", actor.userId);
    return { ok: true as const, data: { id } };
  });
}
export async function downloadDocument(id: string) {
  if (!z.uuid().safeParse(id).success) return null;
  return db().transaction(async tx => {
    const actor = await clinicalActor(tx, "physicians:read"); if (!actor) return null;
    const [doc] = await tx.select().from(physicianDocuments).where(and(eq(physicianDocuments.id, id), eq(physicianDocuments.organisationId, actor.organisationId)));
    if (!doc) return null;
    const metadata = metadataSchema.parse(JSON.parse(unseal(doc.metadata, actor.organisationId, doc.id, "cv-metadata")));
    const response = await cvObject(doc.objectPath, "GET");
    const bytes = Buffer.from(unseal(await response.text(), actor.organisationId, id, "cv"), "base64");
    await clinicalEvent(tx, actor.organisationId, "physicians.cv_downloaded", actor.userId);
    return { bytes, type: metadata.type };
  });
}
