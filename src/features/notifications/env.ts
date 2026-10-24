// Server-only delivery-event configuration: opt-in until migration and AWS topic setup are complete.
import "server-only";
import { z } from "zod";
export function emailEventEnv() {
  const parsed = z.object({
    CLINICAL_EMAIL_EVENTS_ENABLED: z.literal("true"),
    AWS_SES_EVENT_TOPIC_ARN: z.string().regex(/^arn:aws:sns:[a-z]{2}-[a-z]+-\d:\d{12}:[A-Za-z0-9_-]+$/),
    CLINICAL_SMTP_FROM: z.email(),
  }).safeParse(process.env);
  if (!parsed.success) throw new Error("Email event configuration is incomplete.");
  return { ...parsed.data, region: parsed.data.AWS_SES_EVENT_TOPIC_ARN.split(":")[3] };
}
export function emailEventsConfigured() { try { emailEventEnv(); return true; } catch { return false; } }
