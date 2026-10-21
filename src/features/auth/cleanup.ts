// Server-only housekeeping: remove expired secrets/counters; immutable audit history is retained.
import "server-only";
import { lte, or, gte } from "drizzle-orm";
import { db } from "@/lib/db";
import { sessions, resetTokens, rateLimits, mailOutbox } from "@/lib/db/schema";
import { AUTH_POLICY } from "@/config/auth";
export async function cleanExpiredAuthData() {
  const now = new Date();
  await db().transaction(async tx => {
    await tx.delete(mailOutbox).where(or(lte(mailOutbox.expiresAt, now), gte(mailOutbox.attempts, 5)));
    await tx.delete(resetTokens).where(lte(resetTokens.expiresAt, now));
    await tx.delete(sessions).where(or(lte(sessions.expiresAt, now),
      lte(sessions.lastSeenAt, new Date(now.getTime() - AUTH_POLICY.idleSeconds * 1000))));
    await tx.delete(rateLimits).where(lte(rateLimits.expiresAt, now));
  });
}
