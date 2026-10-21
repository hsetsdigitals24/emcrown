// Server-only approved-provider adapters: generic subjects, no delivery-body logging or clinical detail.
import "server-only";
import nodemailer from "nodemailer";
import { z } from "zod";
import { deliveryEnv, smsEnv } from "@/features/clinical/env";
import { CLINICAL_COPY } from "@/config/clinical";
import { calendarAttachment } from "@/features/appointments/calendar";
import { authEnv } from "@/lib/auth-env";
export const messagePayloadSchema = z.object({ to: z.string().min(1).max(320), text: z.string().max(5000), calendar: z.object({ startUtc: z.iso.datetime(), endUtc: z.iso.datetime(), location: z.string().max(300), uid: z.uuid() }).optional() }).strict();
export function normalizePhone(value: string) {
  const digits = value.replace(/\D/g, "");
  return value.startsWith("+") ? `+${digits}` : digits.length === 10 ? `+1${digits}` : `+${digits}`;
}
export async function deliverMessage(id: string, channel: string, payload: z.infer<typeof messagePayloadSchema>) {
  const env = deliveryEnv();
  if (channel === "sms") {
    const sms = smsEnv();
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sms.TWILIO_ACCOUNT_SID}/Messages.json`, {
      method: "POST", headers: { Authorization: `Basic ${Buffer.from(`${sms.TWILIO_ACCOUNT_SID}:${sms.TWILIO_AUTH_TOKEN}`).toString("base64")}` },
      body: new URLSearchParams({ To: normalizePhone(payload.to), MessagingServiceSid: sms.TWILIO_MESSAGING_SERVICE_SID, Body: payload.text,
        StatusCallback: `${authEnv().AUTH_ORIGIN}/api/booking/sms/status` }),
      cache: "no-store", redirect: "error", signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw new Error("Delivery unavailable.");
    return z.object({ sid: z.string().regex(/^SM[a-f0-9]{32}$/i) }).parse(await response.json()).sid;
  }
  const transport = nodemailer.createTransport({ host: env.CLINICAL_SMTP_HOST, port: env.CLINICAL_SMTP_PORT,
    secure: env.CLINICAL_SMTP_PORT === 465, requireTLS: true, auth: { user: env.CLINICAL_SMTP_USER, pass: env.CLINICAL_SMTP_PASSWORD },
    connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 15000 });
  const sent = await transport.sendMail({ from: env.CLINICAL_SMTP_FROM, to: z.email().parse(payload.to), subject: CLINICAL_COPY.notificationSubject,
    text: payload.text, messageId: `<${id}@${new URL(authEnv().AUTH_ORIGIN).hostname}>`,
    ...(payload.calendar ? { attachments: [{ filename: "appointment.ics", content: calendarAttachment(payload.calendar), contentType: "text/calendar; charset=utf-8" }] } : {}) });
  if (!sent.accepted?.length) throw new Error("Delivery unavailable.");
  return id;
}
