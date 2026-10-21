// Server-only configuration: secrets are validated without exposing values in errors.
import "server-only";
import { z } from "zod";
import { CACHE_COMPONENTS_ENABLED } from "@/config/rendering";
const smtpSender = z.string().trim().max(320).refine(value => {
  if (/[\r\n]/.test(value)) return false;
  if (z.email().safeParse(value).success) return true;
  // Nodemailer accepts one named mailbox as well as a bare email address.
  const namedMailbox = /^[^<>\r\n]+<([^<>\s]+)>$/.exec(value);
  return !!namedMailbox && z.email().safeParse(namedMailbox[1]).success;
});
const schema = z.object({
  DATABASE_URL: z.string().url().refine(value => /^postgres(ql)?:/.test(value)),
  DATABASE_CA_CERT: z.string().optional(),
  AUTH_ORIGIN: z.string().url().refine(value => new URL(value).origin === value),
  AUTH_SECRET: z.string().regex(/^[a-f0-9]{64}$/),
  SUPER_ADMIN_EMAIL: z.email(), ORGANISATION_NAME: z.string().min(1).max(120),
  SMTP_HOST: z.string().min(1), SMTP_PORT: z.coerce.number().int().min(1).max(65535),
  SMTP_USER: z.string().min(1), SMTP_PASSWORD: z.string().min(1), SMTP_FROM: smtpSender,
});
export function validateAuthEnv(input: unknown) {
  const result = schema.safeParse(input);
  if (!result.success) {
    const fields = [...new Set(result.error.issues.map(issue => String(issue.path[0])))];
    throw new Error(`Admin authentication configuration is invalid. Check: ${fields.join(", ")}.`);
  }
  return result.data;
}
export function authEnv() {
  const env = validateAuthEnv(process.env);
  // Next.js documents nonce CSP as incompatible with Cache Components/PPR.
  // Fail closed if incompatible caching is accidentally enabled again.
  if (process.env.NODE_ENV === "production" && CACHE_COMPONENTS_ENABLED) {
    throw new Error("Production admin authentication awaits the nonce CSP rendering migration.");
  }
  if (process.env.NODE_ENV === "production" && !env.AUTH_ORIGIN.startsWith("https://")) {
    throw new Error("Admin authentication requires HTTPS.");
  }
  return env;
}
export function authConfigured() {
  try { authEnv(); return true; } catch { return false; }
}
