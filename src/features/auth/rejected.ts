// Server-only rejected-input auditing: throttle first and never persist submitted fields.
import "server-only";
import { validateRequest } from "@/features/auth/request";
import { db } from "@/lib/db";
import { audit } from "@/features/auth/audit";
import type { AuditAction } from "@/types/auth";
export async function rejected(action: AuditAction) {
  try {
    if (await validateRequest("invalid", action, 10)) await db().transaction(tx => audit(tx, action, "failure"));
  } catch { /* Configuration or database failures must not expose internal details. */ }
}
