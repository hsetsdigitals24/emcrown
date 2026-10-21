// Server-only invitations: inactive new identities, expiring hashed tokens and encrypted mail.
import "server-only";
import { and, eq, gt, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, invitations, mailOutbox } from "@/lib/db/schema";
import { hashPassword, randomToken, tokenHash, encrypt } from "@/features/auth/crypto";
import { readSession, createSession } from "@/features/auth/session";
import { lockOwner, freshMfa } from "@/features/auth/step-up";
import { audit } from "@/features/auth/audit";
import { HANDOVER_POLICY } from "@/config/handover";
export async function inviteMember(email: string, code: string) {
  const passwordHash = await hashPassword(randomToken());
  return db().transaction(async tx => {
    const actor = await lockOwner(tx);
    if (!actor || actor.role !== "super_admin" || !await freshMfa(tx, actor, code)) {
      await audit(tx, "members.invited", "denied", actor ?? undefined); return false;
    }
    // Existing identities cannot be overwritten or silently added to another tenant.
    let [user] = await tx.insert(users).values({ email, passwordHash, active: false, mustChangePassword: true })
      .onConflictDoNothing().returning();
    if (!user) {
      const [pending] = await tx.select({ user: users }).from(users).innerJoin(invitations, eq(invitations.userId, users.id))
        .where(and(eq(users.email, email), eq(users.active, false), eq(invitations.organisationId, actor.organisationId))).for("update");
      if (!pending) { await audit(tx, "members.invited", "failure", actor); return false; }
      user = pending.user;
      await tx.delete(invitations).where(eq(invitations.userId, user.id));
    }
    const token = randomToken();
    const expiresAt = new Date(Date.now() + HANDOVER_POLICY.invitationSeconds * 1000);
    await tx.insert(invitations).values({ tokenHash: tokenHash(token), userId: user.id, organisationId: actor.organisationId, expiresAt });
    await tx.insert(mailOutbox).values({ userId: user.id, payload: encrypt(token), kind: "invitation", expiresAt })
      .onConflictDoUpdate({ target: mailOutbox.userId, set: { payload: encrypt(token), kind: "invitation", expiresAt, attempts: 0, availableAt: new Date() } });
    await audit(tx, "members.invited", "success", actor);
    return true;
  });
}
export async function acceptInvitation(token: string, password: string) {
  const passwordHash = await hashPassword(password);
  return db().transaction(async tx => {
    // Do not replace another signed-in account, even if a valid invitation is supplied.
    if (await readSession(tx)) return null;
    const [candidate] = await tx.select().from(invitations).where(and(eq(invitations.tokenHash, tokenHash(token)), gt(invitations.expiresAt, new Date())));
    if (!candidate) { await audit(tx, "members.accepted", "failure"); return null; }
    await tx.select({ id: users.id }).from(users).where(eq(users.id, candidate.userId)).for("update");
    const rows = await tx.execute(sql`select emcrown_admin.accept_invitation(${tokenHash(token)}) as accepted`);
    if (!rows[0]?.accepted) { await audit(tx, "members.accepted", "failure"); return null; }
    await tx.update(users).set({ passwordHash, mustChangePassword: false, active: true }).where(eq(users.id, candidate.userId));
    await tx.delete(mailOutbox).where(eq(mailOutbox.userId, candidate.userId));
    await audit(tx, "members.accepted", "success", { userId: candidate.userId, organisationId: candidate.organisationId, role: "staff" });
    return createSession(tx, candidate.userId, candidate.organisationId, "enroll");
  });
}
