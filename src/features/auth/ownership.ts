// Server-only handover: fresh MFA followed by a database-enforced permanent transfer latch.
import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { memberships, users, ownership } from "@/lib/db/schema";
import { readSession } from "@/features/auth/session";
import { lockOwner, freshMfa } from "@/features/auth/step-up";
import { audit } from "@/features/auth/audit";
export async function transferOwnership(targetId: string, code: string) {
  return db().transaction(async tx => {
    const actor = await lockOwner(tx);
    if (!actor || actor.role !== "super_admin" || !await freshMfa(tx, actor, code)) {
      await audit(tx, "ownership.transferred", "denied", actor ?? undefined); return false;
    }
    const result = await tx.execute(sql`select emcrown_admin.transfer_ownership(${actor.tokenHash}, ${targetId}::uuid) as transferred`);
    if (!result[0]?.transferred) { await audit(tx, "ownership.transferred", "denied", actor); return false; }
    // Audit the initiating owner; the permanently latched ownership row records the recipient.
    return true;
  });
}
export async function securityDetails() {
  const actor = await readSession();
  if (!actor || actor.stage !== "full") return null;
  const [owner] = await db().select().from(ownership).where(eq(ownership.organisationId, actor.organisationId));
  const isOwner = actor.role === "super_admin" && owner?.ownerId === actor.userId;
  const candidates = isOwner && !owner.transferredAt ? await db().select({ id: users.id, email: users.email })
    .from(memberships).innerJoin(users, eq(users.id, memberships.userId))
    .where(and(eq(memberships.organisationId, actor.organisationId), eq(memberships.active, true),
      eq(users.active, true), eq(users.mustChangePassword, false), sql`${users.mfaSecret} is not null`, sql`${users.id} <> ${actor.userId}`)) : [];
  return { isOwner, locked: Boolean(owner?.transferredAt), candidates };
}
