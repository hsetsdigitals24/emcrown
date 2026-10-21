// Shared response schemas keep private and public HTTP projections explicit and validated.
import { z } from "zod";
import { patientSchema } from "@/features/clinical/validation";
export const availabilitySchema = z.array(z.object({ physicianId: z.uuid(), locationId: z.string(), typeId: z.string(), startUtc: z.iso.datetime(), endUtc: z.iso.datetime(), bufferMinutes: z.number().int().nonnegative() }).strict()).max(30000);
export const appointmentSchema = z.object({ id: z.uuid(), physicianId: z.uuid(), locationId: z.string(), typeId: z.string(),
  startUtc: z.iso.datetime(), endUtc: z.iso.datetime(), status: z.enum(["requested", "confirmed", "cancelled", "completed", "no_show"]), version: z.number().int().positive(), patient: patientSchema }).strict();
export const inboxSchema = z.object({ appointments: z.array(appointmentSchema), page: z.number().int().nonnegative(), hasMore: z.boolean(),
  messages: z.array(z.object({ appointmentId: z.uuid(), channel: z.string(), kind: z.string(), state: z.string() })) }).strict();
export type InboxData = z.infer<typeof inboxSchema>;
