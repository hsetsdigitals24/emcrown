// Server-only sessions: opaque cookies, fresh membership checks, expiry and stage gating.
import "server-only";
import { cookies } from "next/headers";
import { and, eq, gt } from "drizzle-orm";
import { db, type AuthTransaction } from "@/lib/db";
import { sessions, users, memberships, organisations } from "@/lib/db/schema";
import { randomToken, tokenHash, encrypt } from "@/features/auth/crypto";
import { AUTH_POLICY } from "@/config/auth";
import { generateSecret } from "otplib";
import type { SessionStage } from "@/types/auth";
const cookieName = () => process.env.NODE_ENV === "production" ? "__Host-emcrown_admin" : "emcrown_admin";
export async function readSessionToken() {
  const token = (await cookies()).get(cookieName())?.value;
  return token && /^[a-f0-9]{64}$/.test(token) ? token : null;
}
export async function readSession(tx?: AuthTransaction | ReturnType<typeof db>) {
  const token = await readSessionToken();
  if (!token) return null;
  const database = tx ?? db();
  const now = new Date();
  const [session] = await database.select({
    tokenHash: sessions.tokenHash, userId: users.id, organisationId: organisations.id,
    organisationName: organisations.name, role: memberships.role, stage: sessions.stage,
    enrollmentSecret: sessions.enrollmentSecret, email: users.email,
    mustChangePassword: users.mustChangePassword, mfaSecret: users.mfaSecret,
    lastMfaStep: users.lastMfaStep,
  }).from(sessions).innerJoin(users, eq(users.id, sessions.userId))
    .innerJoin(memberships, and(eq(memberships.userId, users.id), eq(memberships.organisationId, sessions.organisationId)))
    .innerJoin(organisations, eq(organisations.id, memberships.organisationId))
    .where(and(eq(sessions.tokenHash, tokenHash(token)), eq(users.active, true), eq(memberships.active, true),
      gt(sessions.expiresAt, now), gt(sessions.lastSeenAt, new Date(now.getTime() - AUTH_POLICY.idleSeconds * 1000))))
    .limit(1);
  if (!session) return null;
  if (session.stage === "full" && (session.mustChangePassword || !session.mfaSecret)) return null;
  return session;
}
export type AdminSession = NonNullable<Awaited<ReturnType<typeof readSession>>>;
export async function createSession(tx: AuthTransaction, userId: string, organisationId: string, stage: SessionStage) {
  const token = randomToken();
  const seconds = stage === "full" ? AUTH_POLICY.sessionSeconds : AUTH_POLICY.challengeSeconds;
  await tx.insert(sessions).values({ tokenHash: tokenHash(token), userId, organisationId, stage,
    enrollmentSecret: stage === "enroll" ? encrypt(generateSecret()) : null,
    expiresAt: new Date(Date.now() + seconds * 1000) });
  return { token, seconds };
}
export async function setSessionCookie(session: { token: string; seconds: number }) {
  (await cookies()).set(cookieName(), session.token, {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict",
    path: "/", maxAge: session.seconds, priority: "high",
  });
}
export async function clearSessionCookie() { (await cookies()).delete(cookieName()); }
export function sessionDestination(stage: SessionStage) {
  return stage === "full" ? "/emcrown-admin" : stage === "password" ? "/emcrown-admin/change-password" : "/emcrown-admin/mfa";
}
