// Server-only bootstrap: insert once; never reset existing credentials or elevate existing users.
import "server-only";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { organisations, users, memberships, ownership } from "@/lib/db/schema";
import { authEnv } from "@/lib/auth-env";
import { hashPassword } from "@/features/auth/crypto";
import { audit } from "@/features/auth/audit";
export async function seedOrganisation() {
  const env = authEnv();
  const password = z.string().min(8).max(128).parse(process.env.SUPER_ADMIN_INITIAL_PASSWORD);
  if (process.env.NODE_ENV === "production" && (password.length < 12 || password.toLowerCase() === "password123")) {
    throw new Error("Production bootstrap requires a strong initial password.");
  }
  const email = env.SUPER_ADMIN_EMAIL.trim().toLowerCase();
  const passwordHash = await hashPassword(password);
  await db().transaction(async tx => {
    // A transaction-level advisory lock makes concurrent bootstrap safe.
    const { sql } = await import("drizzle-orm");
    await tx.execute(sql`select pg_advisory_xact_lock(186734912)`);
    const [existing] = await tx.select().from(organisations).where(eq(organisations.key, "emcrown"));
    if (existing) return;
    const [existingUser] = await tx.select().from(users).where(eq(users.email, email));
    if (existingUser) throw new Error("Bootstrap requires a new account.");
    const [organisation] = await tx.insert(organisations).values({ name: env.ORGANISATION_NAME, key: "emcrown" }).returning();
    const [user] = await tx.insert(users).values({ email, passwordHash, mustChangePassword: true }).returning();
    await tx.insert(memberships).values({ organisationId: organisation.id, userId: user.id, role: "super_admin" });
    await tx.insert(ownership).values({ organisationId: organisation.id, ownerId: user.id });
    await audit(tx, "organisation.seeded", "success", { userId: user.id, organisationId: organisation.id, role: "super_admin" });
  });
}
