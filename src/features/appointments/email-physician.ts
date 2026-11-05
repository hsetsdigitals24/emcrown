// Server-only email snapshot: include only explicitly published physician identity, never private profile fields.
import "server-only";
import { and, eq } from "drizzle-orm";
import type { AuthTransaction } from "@/lib/db";
import { physicians } from "@/lib/db/clinical";
import { unseal } from "@/features/clinical/encryption";
import { physicianName } from "@/lib/physician-name";
import { physicianSchema } from "@/features/clinical/validation";
export async function emailPhysician(tx: AuthTransaction, organisationId: string, id: string) {
  const [row] = await tx.select({ publication: physicians.publication }).from(physicians)
    .where(and(eq(physicians.organisationId, organisationId), eq(physicians.id, id)));
  if (!row?.publication) return undefined;
  const raw = JSON.parse(unseal(row.publication, organisationId, id, "publication"));
  const profile = physicianSchema.parse({ ...raw, email: "", phone: "", active: true });
  return { name: physicianName(profile), photo: profile.photo };
}
