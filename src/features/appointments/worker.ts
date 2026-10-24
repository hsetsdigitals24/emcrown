// Server-only outbox worker: claims commit before delivery; ambiguous sends are never auto-replayed.
import "server-only";
import { and, eq, inArray, lt, lte } from "drizzle-orm";
import { db } from "@/lib/db";
import { appointments, appointmentMessages, smsSuppressions } from "@/lib/db/clinical";
import { unseal, privateHash } from "@/features/clinical/encryption";
import { deliverMessage, messagePayloadSchema, normalizePhone } from "@/features/appointments/delivery";
import { deliveryEnv } from "@/features/clinical/env";
import { physicianAlertRecipient } from "@/features/appointments/physician-alerts";
import { clinicalEvent } from "@/features/clinical/access";
async function claimMessage() {
  return db().transaction(async tx => {
    const [row] = await tx.select().from(appointmentMessages).where(and(eq(appointmentMessages.state, "queued"), lte(appointmentMessages.availableAt, new Date())))
      .orderBy(appointmentMessages.availableAt).limit(1).for("update", { skipLocked: true });
    if (!row) return null;
    await tx.update(appointmentMessages).set({ state: "sending", attempts: row.attempts + 1, updatedAt: new Date() }).where(eq(appointmentMessages.id, row.id));
    return row;
  });
}
async function sendClaimed(row: typeof appointmentMessages.$inferSelect) {
  return db().transaction(async tx => {
    const [appointment] = await tx.select().from(appointments).where(eq(appointments.id, row.appointmentId)).for("update");
    if (!appointment || appointment.version !== row.appointmentVersion || (row.kind.startsWith("reminder") && (!inActiveStatus(appointment.status) || appointment.startAt <= new Date()))) {
      await tx.update(appointmentMessages).set({ state: "cancelled", updatedAt: new Date() }).where(eq(appointmentMessages.id, row.id)); return;
    }
    const payload = messagePayloadSchema.parse(JSON.parse(unseal(row.payload, row.organisationId, row.id, "message")));
    if (row.channel === "physician" && await physicianAlertRecipient(tx, row.organisationId, appointment.physicianId) !== payload.to) {
      await tx.update(appointmentMessages).set({ state: "cancelled", updatedAt: new Date() }).where(eq(appointmentMessages.id, row.id)); return;
    }
    if (row.channel === "sms") {
      const [suppressed] = await tx.select().from(smsSuppressions).where(and(eq(smsSuppressions.organisationId, row.organisationId), eq(smsSuppressions.phoneHash, privateHash(normalizePhone(payload.to)))));
      if (suppressed) { await tx.update(appointmentMessages).set({ state: "cancelled", updatedAt: new Date() }).where(eq(appointmentMessages.id, row.id)); return; }
    }
    const providerId = await deliverMessage(row.id, row.channel, payload);
    await tx.update(appointmentMessages).set({ state: "sent", providerId, updatedAt: new Date() }).where(eq(appointmentMessages.id, row.id));
    await clinicalEvent(tx, row.organisationId, "appointments.notification_accepted", undefined, row.appointmentId);
  });
}
function inActiveStatus(status: string) { return ["requested", "confirmed"].includes(status); }
export async function deliverAppointments(limit = 25) {
  deliveryEnv();
  // A crash after provider acceptance is ambiguous. Mark stale claims failed for staff review.
  await db().update(appointmentMessages).set({ state: "failed", updatedAt: new Date() }).where(and(eq(appointmentMessages.state, "sending"), lt(appointmentMessages.updatedAt, new Date(Date.now() - 10 * 60000))));
  let processed = 0;
  for (let index = 0; index < Math.min(100, limit); index++) {
    const row = await claimMessage(); if (!row) break;
    try { await sendClaimed(row); } catch {
      await db().update(appointmentMessages).set({ state: "failed", updatedAt: new Date() }).where(and(eq(appointmentMessages.id, row.id), inArray(appointmentMessages.state, ["sending", "queued"])));
    }
    processed++;
  }
  return processed;
}
