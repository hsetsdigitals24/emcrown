// Server-only availability: public approved providers and all active reservations share one source.
import "server-only";
import { and, eq, gte, inArray, lt, ne } from "drizzle-orm";
import { appointments, physicians, providerSchedules } from "@/lib/db/clinical";
import type { AuthTransaction } from "@/lib/db";
import { scheduleSchema } from "@/features/clinical/validation";
import { buildSlots } from "@/features/appointments/slots";
import { CLINICAL_POLICY } from "@/config/clinical";
export async function availableSlots(tx: AuthTransaction, organisationId: string, from: string, days = CLINICAL_POLICY.defaultHorizonDays, exceptId?: string) {
  const requested = Date.parse(`${from}T12:00:00Z`);
  const horizon = Date.now() + CLINICAL_POLICY.horizonDays * 86400000;
  if (!Number.isFinite(requested) || requested < Date.now() - 2 * 86400000 || requested > horizon) return [];
  const end = new Date(`${from}T00:00:00Z`); end.setUTCDate(end.getUTCDate() + days + 2);
  const start = new Date(`${from}T00:00:00Z`); start.setUTCDate(start.getUTCDate() - 1);
  const definitions = await tx.select({ definition: providerSchedules.definition, publication: physicians.publication }).from(providerSchedules)
    .innerJoin(physicians, and(eq(physicians.id, providerSchedules.physicianId), eq(physicians.organisationId, organisationId)))
    .where(and(eq(providerSchedules.organisationId, organisationId), eq(physicians.active, true)));
  const busy = await tx.select({ physicianId: appointments.physicianId, startAt: appointments.startAt, occupiedUntil: appointments.occupiedUntil }).from(appointments)
    .where(and(eq(appointments.organisationId, organisationId), inArray(appointments.status, ["requested", "confirmed"]),
      lt(appointments.startAt, end), gte(appointments.occupiedUntil, start), exceptId ? ne(appointments.id, exceptId) : undefined));
  return buildSlots(definitions.flatMap(row => {
    const parsed = scheduleSchema.safeParse(row.definition);
    return parsed.success && row.publication ? [parsed.data] : [];
  }), busy, from, days).filter(slot => Date.parse(slot.startUtc) <= horizon);
}
