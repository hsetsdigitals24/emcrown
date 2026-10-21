// Server-only expiring signed bearer links: opaque record ID, random entropy and version binding.
import "server-only";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { privateHash, constantEqual } from "@/features/clinical/encryption";
import { CLINICAL_POLICY } from "@/config/clinical";
const payloadSchema = z.object({ id: z.uuid(), version: z.number().int().positive(), expires: z.number().int().positive(), nonce: z.string().regex(/^[a-f0-9]{64}$/), purpose: z.literal("appointment-manage") }).strict();
export function createManageToken(id: string, version: number, starts: Date) {
  const expiresAt = new Date(Math.min(Date.now() + CLINICAL_POLICY.manageDays * 86400000, starts.getTime()));
  const payload = Buffer.from(JSON.stringify({ id, version, expires: expiresAt.getTime(), nonce: randomBytes(32).toString("hex"), purpose: "appointment-manage" })).toString("base64url");
  const token = `${payload}.${privateHash(payload)}`;
  return { token, hash: privateHash(token), expiresAt };
}
export function verifyManageToken(token: string) {
  if (token.length > 1500) return null;
  const [payload, signature, extra] = token.split(".");
  if (!payload || !signature || extra !== undefined || !constantEqual(privateHash(payload), signature)) return null;
  try {
    const parsed = payloadSchema.safeParse(JSON.parse(Buffer.from(payload, "base64url").toString("utf8")));
    return parsed.success && parsed.data.expires > Date.now() ? { ...parsed.data, hash: privateHash(token) } : null;
  } catch { return null; }
}
