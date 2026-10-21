// Server-only authenticated encryption: independent, versioned keys and record-bound ciphertext.
import "server-only";
import { randomBytes, createCipheriv, createDecipheriv, createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";
const keySchema = z.record(z.string().regex(/^[a-z0-9_-]{1,30}$/), z.string().regex(/^[a-f0-9]{64}$/));
export function clinicalKeys() {
  const active = process.env.CLINICAL_ACTIVE_KEY ?? "";
  let input: unknown;
  try { input = JSON.parse(process.env.CLINICAL_ENCRYPTION_KEYS ?? ""); } catch { throw new Error("Clinical encryption configuration is missing."); }
  const keys = keySchema.parse(input);
  if (!Object.hasOwn(keys, active) || !/^[a-z0-9_-]{1,30}$/.test(active)) throw new Error("Clinical active encryption key is missing.");
  return { active, keys };
}
export function clinicalConfigured() { try { clinicalKeys(); return true; } catch { return false; } }
function aad(organisationId: string, id: string, purpose: string) { return Buffer.from(JSON.stringify(["clinical:v1", organisationId, id, purpose])); }
export function seal(value: string, organisationId: string, id: string, purpose: string) {
  const { active, keys } = clinicalKeys();
  const nonce = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", Buffer.from(keys[active], "hex"), nonce);
  cipher.setAAD(aad(organisationId, id, purpose));
  const bytes = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return ["v1", active, nonce.toString("base64url"), cipher.getAuthTag().toString("base64url"), bytes.toString("base64url")].join(".");
}
export function unseal(value: string, organisationId: string, id: string, purpose: string) {
  const { keys } = clinicalKeys();
  const [version, keyId, nonce, tag, data, extra] = value.split(".");
  if (version !== "v1" || !keys[keyId] || !nonce || !tag || data === undefined || extra !== undefined) throw new Error("Invalid encrypted record.");
  const decipher = createDecipheriv("aes-256-gcm", Buffer.from(keys[keyId], "hex"), Buffer.from(nonce, "base64url"));
  decipher.setAAD(aad(organisationId, id, purpose)); decipher.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(data, "base64url")), decipher.final()]).toString("utf8");
}
export function privateHash(value: string) {
  const key = process.env.CLINICAL_TOKEN_KEY;
  if (!key || !/^[a-f0-9]{64}$/.test(key)) throw new Error("Clinical token configuration is missing.");
  return createHmac("sha256", Buffer.from(key, "hex")).update(value).digest("hex");
}
export function constantEqual(left: string, right: string) {
  const a = Buffer.from(left); const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}
