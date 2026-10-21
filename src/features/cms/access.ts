// Server-only CMS boundary: current MFA session and role checks inside every transaction.
import "server-only";
import { readSession, readSessionToken } from "@/features/auth/session";
import { hasPermission } from "@/config/auth";
import type { AuthTransaction } from "@/lib/db";
import type { Permission } from "@/types/auth";
import { eq } from "drizzle-orm";
import { sessions } from "@/lib/db/schema";
export async function cmsActor(tx: AuthTransaction, permission: Permission = "content:edit") {
  if (!await readSessionToken()) return null;
  const actor = await readSession(tx);
  if (actor?.stage !== "full" || !hasPermission(actor.role, permission)) return null;
  await tx.update(sessions).set({ lastSeenAt: new Date() }).where(eq(sessions.tokenHash, actor.tokenHash));
  return actor;
}
