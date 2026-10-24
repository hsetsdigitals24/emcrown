// Server-only provider webhooks: authenticate full form signatures before touching consent/delivery state.
import "server-only";
import { createHmac } from "node:crypto";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { organisations } from "@/lib/db/schema";
import { appointmentMessages, smsSuppressions } from "@/lib/db/clinical";
import { allowAttempt } from "@/features/auth/rate-limit";
import { boundedBody } from "@/features/cms/http";
import { twilioSmsEnv } from "@/features/clinical/env";
import { constantEqual, privateHash } from "@/features/clinical/encryption";
import { authEnv } from "@/lib/auth-env";
import { normalizePhone } from "@/features/appointments/delivery";
export async function signedSmsForm(request: Request, pathname: string) {
  const env = twilioSmsEnv();
  if (!await allowAttempt("clinical:sms-webhook", "provider", 5000)) return null;
  if (!request.headers.get("content-type")?.startsWith("application/x-www-form-urlencoded")) return null;
  const form = new URLSearchParams((await boundedBody(request, 16000)).toString("utf8"));
  // Reject duplicate keys rather than accepting an ambiguously canonicalized provider request.
  const keys = [...form.keys()]; if (new Set(keys).size !== keys.length) return null;
  const canonical = `${authEnv().AUTH_ORIGIN}${pathname}` + keys.sort().map(key => key + form.get(key)).join("");
  const signature = createHmac("sha1", env.TWILIO_AUTH_TOKEN).update(canonical).digest("base64");
  if (!constantEqual(signature, request.headers.get("x-twilio-signature") ?? "") || form.get("AccountSid") !== env.TWILIO_ACCOUNT_SID) return null;
  return form;
}
export async function recordSmsConsent(form: URLSearchParams) {
  const input = z.object({ From: z.string().regex(/^\+[1-9]\d{9,14}$/), Body: z.string().max(1600), OptOutType: z.string().optional() }).passthrough().parse(Object.fromEntries(form));
  const keyword = (input.OptOutType ?? input.Body.trim()).toUpperCase();
  return db().transaction(async tx => {
    const [org] = await tx.select({ id: organisations.id }).from(organisations).where(eq(organisations.key, "emcrown")); if (!org) return;
    const phoneHash = privateHash(normalizePhone(input.From));
    if (["STOP", "STOPALL", "UNSUBSCRIBE", "CANCEL", "END", "QUIT", "REVOKE", "OPTOUT"].includes(keyword)) await tx.insert(smsSuppressions).values({ organisationId: org.id, phoneHash }).onConflictDoNothing();
    if (["START", "UNSTOP"].includes(keyword)) await tx.delete(smsSuppressions).where(and(eq(smsSuppressions.organisationId, org.id), eq(smsSuppressions.phoneHash, phoneHash)));
  });
}
export async function recordSmsStatus(form: URLSearchParams) {
  const input = z.object({ MessageSid: z.string().regex(/^SM[a-f0-9]{32}$/i), MessageStatus: z.enum(["accepted", "queued", "sending", "sent", "delivered", "undelivered", "failed", "read"]) }).passthrough().parse(Object.fromEntries(form));
  if (!["failed", "undelivered"].includes(input.MessageStatus)) return;
  await db().update(appointmentMessages).set({ state: "failed", updatedAt: new Date() }).where(and(eq(appointmentMessages.providerId, input.MessageSid), eq(appointmentMessages.channel, "sms")));
}
