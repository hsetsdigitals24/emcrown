// Server-only reservations: authoritative slots, idempotency and transactionally queued confirmations.
import "server-only";
import { randomUUID } from "node:crypto";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { organisations } from "@/lib/db/schema";
import { appointments } from "@/lib/db/clinical";
import { seal, unseal, constantEqual } from "@/features/clinical/encryption";
import { bookingSchema } from "@/features/clinical/validation";
import { availableSlots } from "@/features/appointments/availability";
import { clinicalEvent } from "@/features/clinical/access";
import { queueAppointmentMessages } from "@/features/appointments/notifications";
import { BOOKING_SETTINGS } from "@/config/booking";
import { practiceDate } from "@/features/booking/time";
import type { ClinicalResult } from "@/types/clinical";
import { reviewRecipientAllowed } from "@/features/clinical/review";
export async function reserveAppointment(input: unknown): Promise<ClinicalResult<{ accepted: true }>> {
  const parsed = bookingSchema.safeParse(input); if (!parsed.success) return { ok: false, code: "invalid" };
  const { patient, slot, idempotencyKey } = parsed.data;
  if (!reviewRecipientAllowed(patient.email)) return { ok: false, code: "invalid" };
  if (patient.dateOfBirth > practiceDate(new Date().toISOString(), BOOKING_SETTINGS.timeZone) || patient.dateOfBirth < "1900-01-01") return { ok: false, code: "invalid" };
  return db().transaction(async tx => {
    const [organisation] = await tx.select({ id: organisations.id }).from(organisations).where(eq(organisations.key, "emcrown"));
    if (!organisation) return { ok: false, code: "unavailable" };
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${organisation.id}), hashtext(${idempotencyKey}))`);
    const [existing] = await tx.select().from(appointments).where(and(eq(appointments.organisationId, organisation.id), eq(appointments.idempotencyKey, idempotencyKey)));
    if (existing) return existing.physicianId === slot.physicianId && existing.locationId === slot.locationId && existing.typeId === slot.typeId && existing.startAt.toISOString() === slot.startUtc
      && constantEqual(unseal(existing.patient, organisation.id, existing.id, "patient"), JSON.stringify(patient))
      ? { ok: true, data: { accepted: true } } : { ok: false, code: "conflict" };
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${organisation.id}), hashtext(${slot.physicianId}))`);
    const day = practiceDate(slot.startUtc, BOOKING_SETTINGS.timeZone);
    const found = (await availableSlots(tx, organisation.id, day, 1)).find(item => item.physicianId === slot.physicianId && item.locationId === slot.locationId && item.typeId === slot.typeId && item.startUtc === slot.startUtc);
    if (!found) return { ok: false, code: "conflict" };
    const id = randomUUID();
    const [row] = await tx.insert(appointments).values({ id, organisationId: organisation.id, physicianId: found.physicianId,
      locationId: found.locationId, typeId: found.typeId, startAt: new Date(found.startUtc), endAt: new Date(found.endUtc),
      occupiedUntil: new Date(new Date(found.endUtc).getTime() + found.bufferMinutes * 60000), idempotencyKey,
      patient: seal(JSON.stringify(patient), organisation.id, id, "patient") }).returning();
    await clinicalEvent(tx, organisation.id, "appointments.requested", undefined, id);
    await queueAppointmentMessages(tx, row, patient, "requested");
    return { ok: true, data: { accepted: true } };
  });
}
