// Server-only password changes: consume reset tokens and revoke sessions atomically.
import "server-only";
import { and, eq, gt } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, memberships, resetTokens, sessions, mailOutbox } from "@/lib/db/schema";
import { encrypt, randomToken, tokenHash, hashPassword } from "@/features/auth/crypto";
import { audit } from "@/features/auth/audit";
import { AUTH_POLICY } from "@/config/auth";
export async function requestReset(email: string) {
  await db().transaction(async tx => {
    const [user] = await tx.select().from(users).where(and(eq(users.email, email), eq(users.active, true))).for("update");
    const [member] = user ? await tx.select().from(memberships)
      .where(and(eq(memberships.userId, user.id), eq(memberships.active, true)))
      .orderBy(memberships.organisationId).limit(1) : [];
    const actor = member ? { userId: member.userId, organisationId: member.organisationId, role: member.role } : undefined;
    await audit(tx, "auth.reset_requested", "success", actor);
    if (!user || !member) return;
    const token = randomToken();
    const expiresAt = new Date(Date.now() + AUTH_POLICY.resetSeconds * 1000);
    await tx.delete(resetTokens).where(eq(resetTokens.userId, user.id));
    await tx.insert(resetTokens).values({ tokenHash: tokenHash(token), userId: user.id, expiresAt });
    await tx.insert(mailOutbox).values({ userId: user.id, payload: encrypt(token), expiresAt })
      .onConflictDoUpdate({ target: mailOutbox.userId, set: { payload: encrypt(token), expiresAt, attempts: 0, availableAt: new Date() } });
  });
}
export async function resetPassword(token: string, password: string) {
  const hash = tokenHash(token);
  const passwordHash = await hashPassword(password);
  return db().transaction(async tx => {
    // Lock user first, consistently with login, reset issuance and MFA.
    const [candidate] = await tx.select().from(resetTokens).where(eq(resetTokens.tokenHash, hash));
    if (!candidate) { await audit(tx, "auth.reset_completed", "failure"); return false; }
    const [user] = await tx.select().from(users).where(eq(users.id, candidate.userId)).for("update");
    const [consumed] = await tx.delete(resetTokens).where(and(eq(resetTokens.tokenHash, hash), gt(resetTokens.expiresAt, new Date()))).returning();
    if (!user?.active || !consumed) { await audit(tx, "auth.reset_completed", "failure"); return false; }
    await tx.update(users).set({ passwordHash, mustChangePassword: false }).where(eq(users.id, user.id));
    await tx.delete(sessions).where(eq(sessions.userId, user.id));
    await tx.delete(resetTokens).where(eq(resetTokens.userId, user.id));
    await tx.delete(mailOutbox).where(eq(mailOutbox.userId, user.id));
    const members = await tx.select().from(memberships).where(eq(memberships.userId, user.id));
    for (const member of members) await audit(tx, "auth.reset_completed", "success", { ...member, userId: user.id });
    return true;
  });
}
