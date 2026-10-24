// Server-only integration gates: no real visitor booking or patient delivery before explicit configuration.
import "server-only";
import { z } from "zod";
import { clinicalKeys, privateHash } from "@/features/clinical/encryption";
const smtpSchema = z.object({
  CLINICAL_SMTP_HOST: z.string().min(1), CLINICAL_SMTP_PORT: z.coerce.number().int().min(1).max(65535),
  CLINICAL_SMTP_USER: z.string().min(1), CLINICAL_SMTP_PASSWORD: z.string().min(1), CLINICAL_SMTP_FROM: z.email(),
  CLINICAL_STAFF_EMAIL: z.email(), CLINICAL_RETENTION_DAYS: z.coerce.number().int().min(1).max(36500),
  CLINICAL_INTEGRATIONS_APPROVED: z.literal("true"),
});
export function deliveryEnv() {
  const parsed = smtpSchema.safeParse(process.env);
  if (!parsed.success) throw new Error("Clinical delivery configuration is incomplete.");
  return parsed.data;
}
// Legacy callback validation is isolated so AWS notifications never accept Twilio callbacks.
export function twilioSmsEnv() {
  if (process.env.CLINICAL_SMS_PROVIDER !== "twilio") throw new Error("SMS callback provider is unavailable.");
  const parsed = z.object({ TWILIO_ACCOUNT_SID: z.string().regex(/^AC[a-f0-9]{32}$/i), TWILIO_AUTH_TOKEN: z.string().min(20),
    TWILIO_MESSAGING_SERVICE_SID: z.string().regex(/^MG[a-f0-9]{32}$/i), CLINICAL_SMS_APPROVED: z.literal("true") }).safeParse(process.env);
  if (!parsed.success) throw new Error("Clinical SMS configuration is incomplete.");
  return { provider: "twilio" as const, ...parsed.data };
}
export function smsEnv() {
  if (process.env.CLINICAL_SMS_PROVIDER === "twilio") return twilioSmsEnv();
  const parsed = z.object({
    CLINICAL_SMS_PROVIDER: z.literal("aws"), CLINICAL_SMS_APPROVED: z.literal("true"),
    CLINICAL_SMS_ENABLED: z.literal("true"),
    AWS_REGION: z.string().regex(/^[a-z]{2}-[a-z]+-\d$/),
    AWS_SMS_ORIGINATION_IDENTITY: z.string().min(1).max(256).regex(/^[A-Za-z0-9_:/+\-]+$/),
    AWS_SMS_CONFIGURATION_SET: z.string().min(1).max(256).regex(/^[A-Za-z0-9_:/-]+$/),
    AWS_SMS_PROTECT_CONFIGURATION_ID: z.string().min(1).max(256).regex(/^[A-Za-z0-9_:/-]+$/),
    AWS_SMS_MAX_PRICE: z.string().regex(/^\d{1,2}\.\d{1,5}$/).refine(value => Number(value) > 0),
  }).safeParse(process.env);
  if (!parsed.success) throw new Error("Clinical SMS configuration is incomplete.");
  return { provider: "aws" as const, ...parsed.data };
}
export function liveBookingEnv() {
  clinicalKeys(); privateHash("configuration-check"); const delivery = deliveryEnv();
  const parsed = z.object({ CLINICAL_BOOKING_ENABLED: z.literal("true"), TURNSTILE_SITE_KEY: z.string().min(10), TURNSTILE_SECRET_KEY: z.string().min(10) }).safeParse(process.env);
  if (!parsed.success) throw new Error("Live booking configuration is incomplete.");
  if (process.env.CLINICAL_SMS_ENABLED === "true") smsEnv();
  return { ...delivery, ...parsed.data, smsEnabled: process.env.CLINICAL_SMS_ENABLED === "true" };
}
export function liveBookingConfigured() { try { liveBookingEnv(); return true; } catch { return false; } }
