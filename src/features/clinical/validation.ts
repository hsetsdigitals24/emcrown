// Shared validation: constrain all private records and scheduling input at the boundary.
import { z } from "zod";
import { CLINICAL_POLICY } from "@/config/clinical";
import { RETIRED_LOCATION_IDS } from "@/config/practice";
import { BOOKING_SETTINGS } from "@/config/booking";
const line = (max: number) => z.string().trim().max(max).refine(value => !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value));
export const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => {
  const date = new Date(`${value}T12:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
});
const clock = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
export const physicianSchema = z.object({
  fullName: line(160).min(2), title: line(160), email: z.union([z.email().max(254), z.literal("")]),
  phone: z.string().trim().max(30).regex(/^[+\d\s().-]*$/), bio: line(12000),
  credentials: line(2000), specialties: line(2000), languages: line(1000),
  photo: z.string().max(2048).refine(value => {
    if (!value) return true;
    if (/^\/media\/[\w/.-]+\.(?:webp|png|jpe?g)$/i.test(value)) return !value.includes("..");
    try { const url = new URL(value); return url.protocol === "https:" && !url.username && !url.password; } catch { return false; }
  }),
  notifyAppointments: z.boolean().default(false),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(100), active: z.boolean(),
}).strict();
export const physicianWriteSchema = z.object({ id: z.uuid().optional(), version: z.number().int().nonnegative(),
  profile: physicianSchema, operation: z.enum(["save", "publish", "unpublish", "archive"]) }).strict().refine(value => !value.profile.notifyAppointments || Boolean(value.profile.email), { path: ["profile", "email"], message: "An email address is required for appointment alerts." });
export const patientSchema = z.object({
  name: line(100).min(2), email: z.email().max(254),
  phone: z.string().trim().max(30).regex(/^\+?[\d\s().-]+$/).refine(value => { const count = value.replace(/\D/g, "").length; return count >= 10 && count <= 15; }),
  dateOfBirth: dateSchema, reason: line(300).min(1), smsConsent: z.boolean(), emailConsent: z.boolean(),
  privacyConsent: z.literal(true), consentVersion: z.literal(CLINICAL_POLICY.consentVersion),
}).strict();
export const scheduleSchema = z.object({
  physicianId: z.uuid(), locationId: z.string().refine(value => [...BOOKING_SETTINGS.locationIds, ...RETIRED_LOCATION_IDS].includes(value)),
  typeId: z.string().refine(value => BOOKING_SETTINGS.types.some(type => type.id === value)),
  weekday: z.number().int().min(0).max(6), opens: clock, closes: clock,
  intervalMinutes: z.number().int().min(5).max(180), durationMinutes: z.number().int().min(5).max(180),
  bufferMinutes: z.number().int().min(0).max(120), leadHours: z.number().int().min(0).max(720),
  blockedDates: z.array(dateSchema).max(366),
  blockedTimes: z.array(z.object({ date: dateSchema, start: clock, end: clock }).strict().refine(value => value.start < value.end)).max(366).default([]), enabled: z.boolean(),
}).strict().refine(value => value.opens < value.closes, { message: "Schedule must end after it starts." });
export const slotSchema = z.object({ physicianId: z.uuid(), locationId: z.string().max(100), typeId: z.string().max(100), startUtc: z.iso.datetime() }).strict();
export const bookingSchema = z.object({ slot: slotSchema, patient: patientSchema, idempotencyKey: z.uuid(), captcha: z.string().min(1).max(4096) }).strict();
export const appointmentWriteSchema = z.object({ id: z.uuid(), version: z.number().int().positive(),
  operation: z.enum(["confirm", "cancel", "complete", "no_show", "rebook"]), slot: slotSchema.optional(),
}).strict().refine(value => value.operation !== "rebook" || Boolean(value.slot));
