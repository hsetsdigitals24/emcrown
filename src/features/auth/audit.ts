// Server-only auditing: typed events exclude arbitrary payloads and personal data.
import "server-only";
import { eq } from "drizzle-orm";
import { auditEvents, organisations } from "@/lib/db/schema";
import type { AuthTransaction } from "@/lib/db";
import type { AdminRole, AuditAction } from "@/types/auth";
export type AuditActor = { userId: string; organisationId: string; role: AdminRole };
export async function audit(tx: AuthTransaction, action: AuditAction,
  outcome: "success" | "failure" | "denied", actor?: AuditActor) {
  const [organisation] = actor ? [] : await tx.select({ id: organisations.id }).from(organisations)
    .where(eq(organisations.key, "emcrown")).limit(1);
  // Failed credentials and reset requests do not prove the caller's identity.
  const proven = outcome === "success" && !["auth.reset_requested", "auth.reset_email", "auth.reset_completed", "auth.invitation_email"].includes(action);
  await tx.insert(auditEvents).values({ action, outcome,
    actorId: proven ? actor?.userId : undefined,
    organisationId: actor?.organisationId ?? organisation?.id, actorRole: proven ? actor?.role : undefined });
}
