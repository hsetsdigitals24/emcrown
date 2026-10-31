// Server-only access boundary: check current membership and audit reads/denials atomically.
import "server-only";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { sessions } from "@/lib/db/schema";
import { readActivity } from "@/features/activity/repository";
import { readSession, readSessionToken, sessionDestination } from "@/features/auth/session";
import { hasPermission } from "@/config/auth";
import { audit } from "@/features/auth/audit";
import type { Permission } from "@/types/auth";
export async function authorisedRead(permission: Permission, activityInput: unknown = {}) {
  // Missing/malformed cookies cannot identify an account: do not open a transaction.
  if (!await readSessionToken()) redirect("/emcrown-admin/login");
  const result = await db().transaction(async tx => {
    const session = await readSession(tx);
    if (!session || session.stage !== "full") return { location: session ? sessionDestination(session.stage) : "/emcrown-admin/login" };
    if (!hasPermission(session.role, permission)) {
      await audit(tx, "access.denied", "denied", session); return { denied: true };
    }
    await tx.update(sessions).set({ lastSeenAt: new Date() }).where(eq(sessions.tokenHash, session.tokenHash));
    await audit(tx, permission === "audit:read" ? "audit.viewed" : "portal.viewed", "success", session);
    const activity = permission === "audit:read" ? await readActivity(tx, session.organisationId, session.userId, activityInput) : undefined;
    const events = activity?.events ?? [];
    // Only this safe projection may reach UI; never return the session's MFA material.
    return { actor: { userId: session.userId, role: session.role, organisationName: session.organisationName }, events, activity };
  });
  if (result.location) redirect(result.location);
  return result;
}
