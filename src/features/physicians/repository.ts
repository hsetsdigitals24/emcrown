// Server-only physician records: private ciphertext and a separately approved public projection.
import "server-only";
import { cache } from "react";
import { randomUUID } from "node:crypto";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { physicians, physicianDocuments } from "@/lib/db/clinical";
import { organisations } from "@/lib/db/schema";
import { physicianSchema, physicianWriteSchema } from "@/features/clinical/validation";
import { seal, unseal, clinicalConfigured, privateHash } from "@/features/clinical/encryption";
import { clinicalActor, clinicalEvent } from "@/features/clinical/access";
import { CLINICAL_POLICY } from "@/config/clinical";
import { hasPermission } from "@/config/auth";
import type { ClinicalResult, Physician, PublicPhysician } from "@/types/clinical";
export async function listPhysicians(): Promise<ClinicalResult<Physician[]>> {
  return db().transaction(async tx => {
    const actor = await clinicalActor(tx, "physicians:read"); if (!actor) return { ok: false, code: "denied" };
    const rows = await tx.select().from(physicians).where(eq(physicians.organisationId, actor.organisationId)).orderBy(desc(physicians.updatedAt)).limit(CLINICAL_POLICY.pageSize);
    const docs = await tx.select({ id: physicianDocuments.id, physicianId: physicianDocuments.physicianId }).from(physicianDocuments)
      .where(eq(physicianDocuments.organisationId, actor.organisationId)).orderBy(desc(physicianDocuments.createdAt));
    await clinicalEvent(tx, actor.organisationId, "physicians.viewed", actor.userId);
    return { ok: true, data: rows.map(row => ({ ...physicianSchema.parse(JSON.parse(unseal(row.profile, row.organisationId, row.id, "physician"))),
      id: row.id, version: row.version, active: row.active, published: Boolean(row.publication), documentId: docs.find(doc => doc.physicianId === row.id)?.id })) };
  });
}
export async function writePhysician(input: unknown): Promise<ClinicalResult<{ id: string }>> {
  const parsed = physicianWriteSchema.safeParse(input); if (!parsed.success) return { ok: false, code: "invalid" };
  return db().transaction(async tx => {
    const actor = await clinicalActor(tx, "physicians:manage"); if (!actor) return { ok: false, code: "denied" };
    const { profile, operation, version } = parsed.data;
    if (["publish", "unpublish"].includes(operation) && !hasPermission(actor.role, "content:publish")) return { ok: false, code: "denied" };
    const id = parsed.data.id ?? randomUUID();
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${actor.organisationId}), hashtext(${id}))`);
    const [row] = await tx.select().from(physicians).where(and(eq(physicians.id, id), eq(physicians.organisationId, actor.organisationId))).for("update");
    if ((row?.version ?? 0) !== version || (parsed.data.id && !row)) return { ok: false, code: "conflict" };
    const active = operation === "archive" ? false : profile.active;
    const { email: _email, phone: _phone, active: _active, notifyAppointments: _notify, ...publicProfile } = profile;
    void _email; void _phone; void _active; void _notify;
    const publication = !active || operation === "unpublish" ? null : operation === "publish" ? seal(JSON.stringify(publicProfile), actor.organisationId, id, "publication") : row?.publication ?? null;
    await tx.insert(physicians).values({ id, organisationId: actor.organisationId, profile: seal(JSON.stringify({ ...profile, active }), actor.organisationId, id, "physician"),
      publication, slugHash: privateHash(`physician-slug:${actor.organisationId}:${profile.slug}`), active, version: version + 1 }).onConflictDoUpdate({ target: physicians.id,
      set: { profile: seal(JSON.stringify({ ...profile, active }), actor.organisationId, id, "physician"), publication, slugHash: privateHash(`physician-slug:${actor.organisationId}:${profile.slug}`), active, version: version + 1, updatedAt: new Date() } });
    await clinicalEvent(tx, actor.organisationId, `physicians.${operation}`, actor.userId);
    return { ok: true, data: { id } };
  });
}
export const publicPhysicians = cache(async (): Promise<PublicPhysician[]> => {
  if (!clinicalConfigured()) return [];
  const rows = await db().select({ row: physicians }).from(physicians).innerJoin(organisations, eq(organisations.id, physicians.organisationId))
    .where(and(eq(organisations.key, "emcrown"), eq(physicians.active, true)));
  return rows.flatMap(({ row }) => {
    if (!row.publication) return [];
    const raw = JSON.parse(unseal(row.publication, row.organisationId, row.id, "publication"));
    const profile = physicianSchema.parse({ ...raw, email: "", phone: "", active: true });
    const { email: _email, phone: _phone, active: _active, notifyAppointments: _notify, ...safe } = profile; void _email; void _phone; void _active; void _notify;
    return [{ ...safe, id: row.id }];
  });
});
