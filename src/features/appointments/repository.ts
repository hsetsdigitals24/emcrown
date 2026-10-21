// Server-only appointment inbox: audited access and validated, versioned state transitions.
import "server-only";
import { and, desc, eq, gte, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { appointments, appointmentMessages } from "@/lib/db/clinical";
import { clinicalActor, clinicalEvent } from "@/features/clinical/access";
import { unseal } from "@/features/clinical/encryption";
import { appointmentWriteSchema, dateSchema, patientSchema } from "@/features/clinical/validation";
import { availableSlots } from "@/features/appointments/availability";
import { queueAppointmentMessages } from "@/features/appointments/notifications";
import { practiceDate } from "@/features/booking/time";
import { BOOKING_SETTINGS } from "@/config/booking";
import { CLINICAL_POLICY } from "@/config/clinical";
import type { Appointment, ClinicalResult, VisitStatus } from "@/types/clinical";
const filterSchema = z.object({ page: z.coerce.number().int().min(0).max(10000).default(0), from: dateSchema.optional(), status: z.enum(["requested", "confirmed", "cancelled", "completed", "no_show"]).optional(), physicianId: z.uuid().optional() }).strict();
export function projectAppointment(row: typeof appointments.$inferSelect): Appointment {
  return { id: row.id, physicianId: row.physicianId, locationId: row.locationId, typeId: row.typeId, startUtc: row.startAt.toISOString(), endUtc: row.endAt.toISOString(),
    status: row.status as VisitStatus, version: row.version, patient: patientSchema.parse(JSON.parse(unseal(row.patient, row.organisationId, row.id, "patient"))) };
}
export async function listAppointments(input: unknown): Promise<ClinicalResult<{ appointments: Appointment[]; page: number; hasMore: boolean; messages: Array<{ appointmentId: string; channel: string; kind: string; state: string }> }>> {
  const filters = filterSchema.safeParse(input); if (!filters.success) return { ok: false, code: "invalid" };
  return db().transaction(async tx => {
    const actor = await clinicalActor(tx, "appointments:read"); if (!actor) return { ok: false, code: "denied" };
    const from = filters.data.from ? new Date(`${filters.data.from}T00:00:00Z`) : undefined;
    const found = await tx.select().from(appointments).where(and(eq(appointments.organisationId, actor.organisationId),
      from ? gte(appointments.startAt, from) : undefined, filters.data.status ? eq(appointments.status, filters.data.status) : undefined,
      filters.data.physicianId ? eq(appointments.physicianId, filters.data.physicianId) : undefined)).orderBy(desc(appointments.startAt)).limit(CLINICAL_POLICY.pageSize + 1).offset(filters.data.page * CLINICAL_POLICY.pageSize);
    const rows = found.slice(0, CLINICAL_POLICY.pageSize);
    await clinicalEvent(tx, actor.organisationId, "appointments.list_viewed", actor.userId);
    for (const row of rows) await clinicalEvent(tx, actor.organisationId, "appointments.viewed", actor.userId, row.id);
    const messages = await tx.select({ appointmentId: appointmentMessages.appointmentId, channel: appointmentMessages.channel, kind: appointmentMessages.kind, state: appointmentMessages.state })
      .from(appointmentMessages).where(and(eq(appointmentMessages.organisationId, actor.organisationId), inArray(appointmentMessages.appointmentId, rows.map(row => row.id))));
    return { ok: true, data: { appointments: rows.map(projectAppointment), page: filters.data.page, hasMore: found.length > CLINICAL_POLICY.pageSize, messages: messages.filter(message => rows.some(row => row.id === message.appointmentId)) } };
  });
}
export async function changeAppointment(input: unknown): Promise<ClinicalResult<null>> {
  const parsed = appointmentWriteSchema.safeParse(input); if (!parsed.success) return { ok: false, code: "invalid" };
  return db().transaction(async tx => {
    const actor = await clinicalActor(tx, "appointments:manage"); if (!actor) return { ok: false, code: "denied" };
    const [row] = await tx.select().from(appointments).where(and(eq(appointments.organisationId, actor.organisationId), eq(appointments.id, parsed.data.id))).for("update");
    if (!row || row.version !== parsed.data.version) return { ok: false, code: "conflict" };
    const { operation, slot } = parsed.data;
    if (["complete", "no_show"].includes(operation) && row.endAt > new Date()) return { ok: false, code: "invalid" };
    if ((row.status === "cancelled" && operation !== "rebook") || row.status === "completed" || row.status === "no_show") return { ok: false, code: "invalid" };
    const patch: Partial<typeof appointments.$inferInsert> = { version: row.version + 1, updatedAt: new Date(), status: operation === "cancel" ? "cancelled" : operation === "complete" ? "completed" : operation === "no_show" ? "no_show" : "confirmed" };
    if (operation === "rebook" && slot) {
      await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${actor.organisationId}), hashtext(${slot.physicianId}))`);
      const day = practiceDate(slot.startUtc, BOOKING_SETTINGS.timeZone);
      const found = (await availableSlots(tx, actor.organisationId, day, 1, row.id)).find(item => Object.entries(slot).every(([key, value]) => item[key as keyof typeof item] === value));
      if (!found) return { ok: false, code: "conflict" };
      Object.assign(patch, { physicianId: found.physicianId, locationId: found.locationId, typeId: found.typeId, startAt: new Date(found.startUtc), endAt: new Date(found.endUtc), occupiedUntil: new Date(new Date(found.endUtc).getTime() + found.bufferMinutes * 60000) });
    }
    const [updated] = await tx.update(appointments).set(patch).where(eq(appointments.id, row.id)).returning();
    await clinicalEvent(tx, actor.organisationId, `appointments.${operation}`, actor.userId, row.id);
    if (["complete", "no_show"].includes(operation)) await tx.update(appointmentMessages).set({ state: "cancelled" }).where(and(eq(appointmentMessages.appointmentId, row.id), eq(appointmentMessages.state, "queued")));
    else await queueAppointmentMessages(tx, updated, projectAppointment(updated).patient, operation === "cancel" ? "cancelled" : operation === "rebook" ? "rescheduled" : "confirmed");
    return { ok: true, data: null };
  });
}
