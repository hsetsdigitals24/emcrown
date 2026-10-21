// Server-only recovery: hashed codes, account locks, atomic consumption and compulsory new MFA.
import "server-only";
import { randomBytes } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { recoveryCodes, users, sessions, resetTokens, mailOutbox } from "@/lib/db/schema";
import { tokenHash } from "@/features/auth/crypto";
import { lockActor, freshMfa } from "@/features/auth/step-up";
import { createSession } from "@/features/auth/session";
import { audit } from "@/features/auth/audit";
import { HANDOVER_POLICY } from "@/config/handover";
const codeHash = (code: string) => tokenHash(`recovery:${code}`);
export async function generateRecoveryCodes(code: string) {
  return db().transaction(async tx => {
    const actor = await lockActor(tx);
    if (!actor || !await freshMfa(tx, actor, code)) {
      await audit(tx, "auth.recovery_generated", "denied", actor ?? undefined); return null;
    }
    const codes = Array.from({ length: HANDOVER_POLICY.recoveryCodeCount }, () => randomBytes(16).toString("hex"));
    await tx.delete(recoveryCodes).where(eq(recoveryCodes.userId, actor.userId));
    await tx.insert(recoveryCodes).values(codes.map(value => ({ userId: actor.userId, tokenHash: codeHash(value) })));
    await audit(tx, "auth.recovery_generated", "success", actor);
    return codes.map(value => value.match(/.{8}/g)!.join("-"));
  });
}
export async function recoverAuthenticator(code: string) {
  return db().transaction(async tx => {
    const actor = await lockActor(tx);
    // Password must already be verified in a short-lived MFA challenge session.
    if (!actor || actor.stage !== "mfa" || !actor.mfaSecret || actor.mustChangePassword) {
      await audit(tx, "auth.recovered", "denied", actor ?? undefined); return null;
    }
    const [consumed] = await tx.delete(recoveryCodes).where(and(eq(recoveryCodes.userId, actor.userId),
      eq(recoveryCodes.tokenHash, codeHash(code)))).returning();
    if (!consumed) { await audit(tx, "auth.recovered", "failure", actor); return null; }
    // Invalidate the whole old recovery set when replacing an authenticator.
    await tx.delete(recoveryCodes).where(eq(recoveryCodes.userId, actor.userId));
    await tx.update(users).set({ mfaSecret: null, lastMfaStep: -1 }).where(eq(users.id, actor.userId));
    await tx.delete(sessions).where(eq(sessions.userId, actor.userId));
    await tx.delete(resetTokens).where(eq(resetTokens.userId, actor.userId));
    await tx.delete(mailOutbox).where(eq(mailOutbox.userId, actor.userId));
    await audit(tx, "auth.recovered", "success", actor);
    return createSession(tx, actor.userId, actor.organisationId, "enroll");
  });
}
