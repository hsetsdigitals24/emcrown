// Server-only Lambda settings: accept only known application keys, never AWS credentials or owner database overrides.
import "server-only";
import { z } from "zod";
import { authEnv } from "@/lib/auth-env";
import { clinicalKeys, privateHash } from "@/features/clinical/encryption";
import { deliveryEnv } from "@/features/clinical/env";
const names = ["DATABASE_URL", "DATABASE_CA_CERT", "AUTH_ORIGIN", "AUTH_SECRET", "SUPER_ADMIN_EMAIL", "ORGANISATION_NAME",
  "SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASSWORD", "SMTP_FROM", "CLINICAL_ACTIVE_KEY", "CLINICAL_ENCRYPTION_KEYS", "CLINICAL_TOKEN_KEY",
  "CLINICAL_SMTP_HOST", "CLINICAL_SMTP_PORT", "CLINICAL_SMTP_USER", "CLINICAL_SMTP_PASSWORD", "CLINICAL_SMTP_FROM", "CLINICAL_STAFF_EMAIL",
  "CLINICAL_RETENTION_DAYS", "CLINICAL_INTEGRATIONS_APPROVED", "CLINICAL_REVIEW_MODE", "CLINICAL_REVIEW_EMAILS", "CLINICAL_SMS_ENABLED"] as const;
const settingsSchema = z.partialRecord(z.enum(names), z.string());
export function configureWorker(input: unknown) {
  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) throw new Error("Worker settings are invalid.");
  // Replace the allowlisted snapshot on each invocation; removed secret values cannot linger in warm processes.
  for (const name of names) delete process.env[name];
  Object.assign(process.env, parsed.data);
  try {
    authEnv(); clinicalKeys(); privateHash("worker-configuration-check"); deliveryEnv();
    if (process.env.CLINICAL_SMS_ENABLED !== "false") throw new Error("This migration supports email only.");
  } catch { throw new Error("Worker settings are incomplete."); }
}
