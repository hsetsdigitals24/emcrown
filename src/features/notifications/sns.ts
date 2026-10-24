// Server-only SNS authentication: exact topic, trusted certificate origin and RSA-SHA256 signatures.
import "server-only";
import { verify, X509Certificate } from "node:crypto";
import { z } from "zod";
const envelopeSchema = z.object({
  Type: z.enum(["Notification", "SubscriptionConfirmation"]), MessageId: z.uuid(),
  TopicArn: z.string().max(256), Message: z.string().max(200000), Timestamp: z.iso.datetime({ offset: true }),
  SignatureVersion: z.literal("2"), Signature: z.string().min(1).max(8192).regex(/^[A-Za-z0-9+/=]+$/),
  SigningCertURL: z.string().url().max(2048), Subject: z.string().max(100).optional(),
  Token: z.string().max(4096).optional(), SubscribeURL: z.string().url().max(8192).optional(),
});
export class SnsAuthenticationError extends Error {}
export type SnsEnvelope = z.infer<typeof envelopeSchema>;
const certificates = new Map<string, { pem: string; until: number }>();
export function snsCanonical(envelope: SnsEnvelope) {
  const fields: Array<keyof SnsEnvelope> = ["Message", "MessageId"];
  if (envelope.Type === "Notification" && envelope.Subject !== undefined) fields.push("Subject");
  if (envelope.Type === "SubscriptionConfirmation") fields.push("SubscribeURL");
  fields.push("Timestamp");
  if (envelope.Type === "SubscriptionConfirmation") fields.push("Token");
  fields.push("TopicArn", "Type");
  return fields.map(field => `${field}\n${envelope[field]}\n`).join("");
}
async function certificate(url: string) {
  const saved = certificates.get(url);
  if (saved && saved.until > Date.now()) return saved.pem;
  // The caller restricts this to the exact regional SNS HTTPS origin, never an arbitrary URL.
  const response = await fetch(url, { redirect: "error", signal: AbortSignal.timeout(5000), cache: "no-store" });
  if (!response.ok || Number(response.headers.get("content-length")) > 16000) throw new Error("Certificate unavailable.");
  const reader = response.body?.getReader(); if (!reader) throw new Error("Certificate unavailable.");
  const chunks: Uint8Array[] = []; let size = 0;
  while (true) {
    const part = await reader.read(); if (part.done) break;
    size += part.value.byteLength;
    if (size > 16000) { await reader.cancel(); throw new Error("Certificate unavailable."); }
    chunks.push(part.value);
  }
  const pem = Buffer.concat(chunks).toString("utf8");
  if (certificates.size >= 10) certificates.clear();
  certificates.set(url, { pem, until: Date.now() + 3600000 }); return pem;
}
export async function verifySns(input: unknown, topic: string, loadCertificate = certificate) {
  const envelope = envelopeSchema.parse(input);
  if (envelope.TopicArn !== topic) throw new SnsAuthenticationError("Unexpected topic.");
  const region = topic.split(":")[3];
  const url = new URL(envelope.SigningCertURL);
  if (url.origin !== `https://sns.${region}.amazonaws.com` || url.username || url.password || url.search || url.hash ||
    !/^\/SimpleNotificationService-[A-Za-z0-9_-]+\.pem$/.test(url.pathname)) throw new SnsAuthenticationError("Unexpected certificate.");
  const age = Date.now() - Date.parse(envelope.Timestamp);
  if (age < -300000 || age > 30 * 86400000) throw new SnsAuthenticationError("Invalid event time.");
  if (envelope.Type === "SubscriptionConfirmation" && (!envelope.Token || !envelope.SubscribeURL)) throw new SnsAuthenticationError("Incomplete confirmation.");
  // HTTPS to SNS validates the download's trust chain; only its PEM can supply the verification key.
  const cert = new X509Certificate(await loadCertificate(url.toString()));
  if (Date.parse(cert.validFrom) > Date.now() || Date.parse(cert.validTo) < Date.now() || cert.publicKey.asymmetricKeyType !== "rsa" ||
    !verify("RSA-SHA256", Buffer.from(snsCanonical(envelope)), cert.publicKey, Buffer.from(envelope.Signature, "base64"))) throw new SnsAuthenticationError("Invalid signature.");
  return envelope;
}
export async function confirmSns(envelope: SnsEnvelope) {
  const region = envelope.TopicArn.split(":")[3];
  const url = new URL(`https://sns.${region}.amazonaws.com/`);
  url.searchParams.set("Action", "ConfirmSubscription"); url.searchParams.set("TopicArn", envelope.TopicArn);
  url.searchParams.set("Token", envelope.Token!);
  const response = await fetch(url, { redirect: "error", signal: AbortSignal.timeout(8000), cache: "no-store" });
  if (!response.ok) throw new Error("Confirmation unavailable.");
}
