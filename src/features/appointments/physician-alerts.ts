// Server-only alert preferences: private contact details never enter public physician projections.
import "server-only";
import { and, eq } from "drizzle-orm";
import type { AuthTransaction } from "@/lib/db";
import { physicians } from "@/lib/db/clinical";
import { unseal } from "@/features/clinical/encryption";
import { physicianSchema } from "@/features/clinical/validation";
export async function physicianAlertRecipient(tx: AuthTransaction, organisationId: string, physicianId: string) {
  const [row] = await tx.select().from(physicians).where(and(eq(physicians.id, physicianId), eq(physicians.organisationId, organisationId)));
  if (!row?.active) return null;
  const profile = physicianSchema.parse(JSON.parse(unseal(row.profile, organisationId, physicianId, "physician")));
  return profile.notifyAppointments && profile.email ? profile.email : null;
}
