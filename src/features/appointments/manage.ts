// Server-only bearer management: signed expiry, database revocation, cutoff and atomic rebooking.
import "server-only";
import { z } from "zod";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { appointments, appointmentTokens } from "@/lib/db/clinical";
import { verifyManageToken } from "@/features/appointments/tokens";
import { slotSchema } from "@/features/clinical/validation";
import { availableSlots } from "@/features/appointments/availability";
import { queueAppointmentMessages } from "@/features/appointments/notifications";
import { projectAppointment } from "@/features/appointments/repository";
import { clinicalEvent } from "@/features/clinical/access";
import { practiceDate } from "@/features/booking/time";
import { BOOKING_SETTINGS } from "@/config/booking";
import { CLINICAL_POLICY } from "@/config/clinical";
const schema = z.object({ token: z.string().max(1500), operation: z.enum(["view", "cancel", "rebook"]), slot: slotSchema.optional() }).strict();
export async function manageAppointment(input: unknown) {
  const parsed = schema.safeParse(input); if (!parsed.success) return { ok: false as const, code: "invalid" as const };
  const token = verifyManageToken(parsed.data.token); if (!token) return { ok: false as const, code: "denied" as const };
  return db().transaction(async tx => {
    const [record] = await tx.select().from(appointmentTokens).where(eq(appointmentTokens.tokenHash, token.hash));
    if (!record || record.appointmentId !== token.id || record.version !== token.version || record.expiresAt <= new Date()) return { ok: false as const, code: "denied" as const };
    const [row] = await tx.select().from(appointments).where(and(eq(appointments.id, token.id), eq(appointments.organisationId, record.organisationId))).for("update");
    if (!row || row.version !== token.version || !["requested", "confirmed"].includes(row.status)) return { ok: false as const, code: "denied" as const };
    const cutoff = row.startAt.getTime() - CLINICAL_POLICY.cancellationHours * 3600000;
    if (Date.now() >= cutoff) return { ok: false as const, code: "denied" as const };
    if (parsed.data.operation === "view") {
      await clinicalEvent(tx, row.organisationId, "appointments.manage_viewed", undefined, row.id);
      return { ok: true as const, data: { startUtc: row.startAt.toISOString(), endUtc: row.endAt.toISOString(), physicianId: row.physicianId,
        typeId: row.typeId, locationId: row.locationId, slots: await availableSlots(tx, row.organisationId, practiceDate(new Date().toISOString(), BOOKING_SETTINGS.timeZone), undefined, row.id) } };
    }
    const patch: Partial<typeof appointments.$inferInsert> = { version: row.version + 1, updatedAt: new Date() };
    if (parsed.data.operation === "cancel") patch.status = "cancelled";
    else {
      const target = parsed.data.slot; if (!target) return { ok: false as const, code: "invalid" as const };
      // Visitors can move the same visit with the same physician/location; staff handle routing changes.
      if (target.physicianId !== row.physicianId || target.typeId !== row.typeId || target.locationId !== row.locationId) return { ok: false as const, code: "invalid" as const };
      await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${row.organisationId}), hashtext(${target.physicianId}))`);
      const found = (await availableSlots(tx, row.organisationId, practiceDate(target.startUtc, BOOKING_SETTINGS.timeZone), 1, row.id))
        .find(item => item.physicianId === target.physicianId && item.typeId === target.typeId && item.locationId === target.locationId && item.startUtc === target.startUtc);
      if (!found) return { ok: false as const, code: "conflict" as const };
      Object.assign(patch, { startAt: new Date(found.startUtc), endAt: new Date(found.endUtc), occupiedUntil: new Date(new Date(found.endUtc).getTime() + found.bufferMinutes * 60000) });
    }
    const [updated] = await tx.update(appointments).set(patch).where(eq(appointments.id, row.id)).returning();
    await queueAppointmentMessages(tx, updated, projectAppointment(updated).patient, parsed.data.operation === "cancel" ? "cancelled" : "rescheduled");
    await clinicalEvent(tx, row.organisationId, `appointments.visitor_${parsed.data.operation}`, undefined, row.id);
    return { ok: true as const, data: { updated: true } };
  });
}
