// Server-only transactional outbox: encrypt recipients and minimal reminder text; never log it.
import "server-only";
import { randomUUID } from "node:crypto";
import { and, eq, inArray } from "drizzle-orm";
import { appointmentMessages, appointmentTokens } from "@/lib/db/clinical";
import type { AuthTransaction } from "@/lib/db";
import type { PatientDetails } from "@/types/clinical";
import { seal } from "@/features/clinical/encryption";
import { createManageToken } from "@/features/appointments/tokens";
import { CLINICAL_POLICY } from "@/config/clinical";
import { authEnv } from "@/lib/auth-env";
import { BOOKING_SETTINGS } from "@/config/booking";
import { SITE_FOOTER } from "@/config/site-shell";
import { publishedPractice } from "@/features/clinical/practice";
import { physicianAlertRecipient } from "@/features/appointments/physician-alerts";
import { formatDay, formatTime, practiceDate } from "@/features/booking/time";
export type MessagePayload = { to: string; text: string; calendar?: { startUtc: string; endUtc: string; location: string; uid: string } };
export async function queueAppointmentMessages(tx: AuthTransaction, row: { physicianId: string; id: string; organisationId: string; version: number; startAt: Date; endAt: Date; locationId: string }, patient: PatientDetails, kind: string) {
  await tx.update(appointmentMessages).set({ state: "cancelled", updatedAt: new Date() }).where(and(eq(appointmentMessages.appointmentId, row.id), inArray(appointmentMessages.state, ["queued", "failed"])));
  await tx.delete(appointmentTokens).where(eq(appointmentTokens.appointmentId, row.id));
  const { token, hash, expiresAt } = createManageToken(row.id, row.version, row.startAt);
  await tx.insert(appointmentTokens).values({ tokenHash: hash, organisationId: row.organisationId, appointmentId: row.id, version: row.version, expiresAt });
  const link = `${authEnv().AUTH_ORIGIN}/book/manage#${token}`;
  const startUtc = row.startAt.toISOString();
  const practice = await publishedPractice(tx);
  const currentLocation = practice.locations.find(item => item.id === row.locationId);
  const location = currentLocation ? `${currentLocation.label} — ${currentLocation.address}` : row.locationId;
  const text = `${SITE_FOOTER.practiceName}\n${formatDay(practiceDate(startUtc, BOOKING_SETTINGS.timeZone), BOOKING_SETTINGS.timeZone, "en-US")} ${formatTime(startUtc, BOOKING_SETTINGS.timeZone, "en-US")}\n${location}\n${link}`;
  const calendar = { startUtc, endUtc: row.endAt.toISOString(), location, uid: row.id };
  const items: Array<{ channel: string; to: string; kind: string; at: Date }> = [];
  // Confirmation/cancellation email is transactional; optional email consent controls reminders.
  items.push({ channel: "email", to: patient.email, kind, at: new Date() });
  if (patient.smsConsent) items.push({ channel: "sms", to: patient.phone, kind, at: new Date() });
  if (process.env.CLINICAL_STAFF_EMAIL) items.push({ channel: "staff", to: process.env.CLINICAL_STAFF_EMAIL, kind, at: new Date() });
  const physicianEmail = await physicianAlertRecipient(tx, row.organisationId, row.physicianId);
  if (physicianEmail && physicianEmail !== process.env.CLINICAL_STAFF_EMAIL) items.push({ channel: "physician", to: physicianEmail, kind, at: new Date() });
  if (kind !== "cancelled") for (const hours of CLINICAL_POLICY.reminderHours) {
    const at = new Date(row.startAt.getTime() - hours * 3600000); if (at <= new Date()) continue;
    if (patient.emailConsent) items.push({ channel: "email", to: patient.email, kind: `reminder-${hours}`, at });
    if (patient.smsConsent) items.push({ channel: "sms", to: patient.phone, kind: `reminder-${hours}`, at });
  }
  for (const item of items) {
    const id = randomUUID();
    // Staff links lead to MFA-protected admin; they never receive the bearer manage token.
    const update = kind === "cancelled" ? "Appointment cancelled" : kind === "rescheduled" ? "Appointment rescheduled" : kind === "confirmed" ? "Appointment confirmed" : "Appointment request received";
    const body = ["staff", "physician"].includes(item.channel) ? `${SITE_FOOTER.practiceName}\n${update}\n${authEnv().AUTH_ORIGIN}/emcrown-admin/appointments`
      : item.kind.startsWith("reminder") ? text : `${update}\n${text}`;
    await tx.insert(appointmentMessages).values({ id, organisationId: row.organisationId, appointmentId: row.id, appointmentVersion: row.version,
      channel: item.channel, kind: item.kind, availableAt: item.at,
      payload: seal(JSON.stringify({ to: item.to, text: body, ...(item.channel === "email" && kind !== "cancelled" ? { calendar } : {}) }), row.organisationId, id, "message") });
  }
}
