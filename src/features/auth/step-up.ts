// Server-only step-up: serialize credential changes and reject replayed authenticator codes.
import "server-only";
import { eq } from "drizzle-orm";
import { verify } from "otplib";
import type { AuthTransaction } from "@/lib/db";
import { users, ownership } from "@/lib/db/schema";
import { readSession, type AdminSession } from "@/features/auth/session";
import { decrypt } from "@/features/auth/crypto";
export async function lockActor(tx: AuthTransaction) {
  const before = await readSession(tx);
  if (!before) return null;
  await tx.select({ id: users.id }).from(users).where(eq(users.id, before.userId)).for("update");
  return readSession(tx);
}
export async function freshMfa(tx: AuthTransaction, actor: AdminSession, code: string) {
  if (actor.stage !== "full" || !actor.mfaSecret || actor.mustChangePassword) return false;
  const result = await verify({ secret: decrypt(actor.mfaSecret), token: code,
    epochTolerance: 30, ...(actor.lastMfaStep >= 0 ? { afterTimeStep: actor.lastMfaStep } : {}) });
  if (!result.valid || !("timeStep" in result)) return false;
  await tx.update(users).set({ lastMfaStep: result.timeStep }).where(eq(users.id, actor.userId));
  return true;
}

export async function lockOwner(tx: AuthTransaction) {
  const before = await readSession(tx);
  if (!before || before.stage !== "full" || before.role !== "super_admin") return null;
  // Owner mutations always lock organisation ownership before users, preventing
  // a concurrent handover/invitation from taking the same locks in reverse order.
  const [record] = await tx.select().from(ownership)
    .where(eq(ownership.organisationId, before.organisationId)).for("update");
  if (!record || record.ownerId !== before.userId) return null;
  const actor = await lockActor(tx);
  return actor?.role === "super_admin" && actor.stage === "full" ? actor : null;
}
