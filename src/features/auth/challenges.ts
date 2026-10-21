// Server-only challenges: lock and re-read sessions before every credential mutation.
import "server-only";
import { eq } from "drizzle-orm";
import { verify } from "otplib";
import { db, type AuthTransaction } from "@/lib/db";
import { users, sessions, resetTokens, mailOutbox } from "@/lib/db/schema";
import { readSession, createSession, type AdminSession } from "@/features/auth/session";
import { decrypt, hashPassword, verifyPassword } from "@/features/auth/crypto";
import { audit } from "@/features/auth/audit";
async function lockedSession(tx: AuthTransaction) {
  const before = await readSession(tx);
  if (!before) return null;
  await tx.select({ id: users.id }).from(users).where(eq(users.id, before.userId)).for("update");
  return readSession(tx);
}
async function replaceSession(tx: AuthTransaction, session: AdminSession, stage: "enroll" | "mfa" | "full") {
  await tx.delete(sessions).where(eq(sessions.tokenHash, session.tokenHash));
  return { ...await createSession(tx, session.userId, session.organisationId, stage), stage };
}
export async function changeTemporaryPassword(password: string) {
  const passwordHash = await hashPassword(password);
  return db().transaction(async tx => {
    const session = await lockedSession(tx);
    if (!session || session.stage !== "password") { await audit(tx, "auth.password_changed", "denied", session ?? undefined); return null; }
    const [user] = await tx.select().from(users).where(eq(users.id, session.userId));
    if (await verifyPassword(password, user.passwordHash)) { await audit(tx, "auth.password_changed", "failure", session); return null; }
    await tx.update(users).set({ passwordHash, mustChangePassword: false }).where(eq(users.id, session.userId));
    await tx.delete(sessions).where(eq(sessions.userId, session.userId));
    await tx.delete(resetTokens).where(eq(resetTokens.userId, session.userId));
    await tx.delete(mailOutbox).where(eq(mailOutbox.userId, session.userId));
    await audit(tx, "auth.password_changed", "success", session);
    const stage: "mfa" | "enroll" = session.mfaSecret ? "mfa" : "enroll";
    return { ...await createSession(tx, session.userId, session.organisationId, stage), stage };
  });
}
export async function verifyMfa(code: string) {
  return db().transaction(async tx => {
    const session = await lockedSession(tx);
    if (!session || !["enroll", "mfa"].includes(session.stage) || session.mustChangePassword) {
      await audit(tx, "auth.mfa_verified", "denied", session ?? undefined); return null;
    }
    // A parallel enrollment must never replace an already confirmed authenticator.
    const encrypted = session.stage === "enroll" && !session.mfaSecret ? session.enrollmentSecret : session.mfaSecret;
    if (!encrypted || (session.stage === "enroll" && session.mfaSecret)) {
      await audit(tx, "auth.mfa_verified", "denied", session); return null;
    }
    const result = await verify({ secret: decrypt(encrypted), token: code,
      epochTolerance: 30, ...(session.lastMfaStep >= 0 ? { afterTimeStep: session.lastMfaStep } : {}) });
    if (!result.valid || !("timeStep" in result)) {
      await audit(tx, "auth.mfa_verified", "failure", session); return null;
    }
    await tx.update(users).set({ mfaSecret: encrypted, lastMfaStep: result.timeStep }).where(eq(users.id, session.userId));
    if (session.stage === "enroll") {
      await tx.delete(sessions).where(eq(sessions.userId, session.userId));
      await audit(tx, "auth.mfa_enrolled", "success", session);
    }
    await audit(tx, "auth.mfa_verified", "success", session);
    return replaceSession(tx, session, "full");
  });
}
