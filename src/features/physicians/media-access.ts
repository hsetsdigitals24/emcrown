// Server-only public photo authorization: only explicit physician publications grant anonymous image access.
import "server-only";
import { and, eq, isNotNull } from "drizzle-orm";
import { organisations } from "@/lib/db/schema";
import { physicians } from "@/lib/db/clinical";
import { unseal } from "@/features/clinical/encryption";
import { physicianSchema } from "@/features/clinical/validation";
import type { AuthTransaction } from "@/lib/db";
export async function publishedPhysicianPhoto(tx: AuthTransaction, organisationId: string, path: string) {
  const rows = await tx.select({ row: physicians }).from(physicians).innerJoin(organisations, eq(organisations.id, physicians.organisationId))
    .where(and(eq(organisations.key, "emcrown"), eq(physicians.organisationId, organisationId), eq(physicians.active, true), isNotNull(physicians.publication)));
  return rows.some(({ row }) => {
    if (!row.publication) return false;
    const profile = physicianSchema.parse({ ...JSON.parse(unseal(row.publication, organisationId, row.id, "publication")), email: "", phone: "", active: true });
    return profile.photo === path;
  });
}
