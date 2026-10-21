// Server-only password verification: lock accounts to serialize reset/login races.
import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, memberships } from "@/lib/db/schema";
import { verifyPassword } from "@/features/auth/crypto";
import { audit } from "@/features/auth/audit";
import { createSession } from "@/features/auth/session";
import type { SessionStage } from "@/types/auth";
// A valid dummy hash keeps unknown-account password work equivalent.
const DUMMY_HASH = `scrypt:${"0".repeat(32)}:${"0".repeat(128)}`;
export async function login(email: string, password: string) {
  return db().transaction(async tx => {
    const [user] = await tx.select().from(users).where(eq(users.email, email)).for("update");
    const valid = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH);
    const [member] = user ? await tx.select().from(memberships)
      .where(and(eq(memberships.userId, user.id), eq(memberships.active, true)))
      .orderBy(memberships.organisationId).limit(1) : [];
    const actor = member ? { userId: member.userId, organisationId: member.organisationId, role: member.role } : undefined;
    if (!valid || !user?.active || !member) {
      await audit(tx, "auth.login", "failure", actor);
      return null;
    }
    const stage: SessionStage = user.mustChangePassword ? "password" : user.mfaSecret ? "mfa" : "enroll";
    const session = await createSession(tx, user.id, member.organisationId, stage);
    await audit(tx, "auth.login", "success", actor);
    return { ...session, stage };
  });
}
