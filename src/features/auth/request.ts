// Server-only request boundary: origin validation and persistent per-identity/global limits.
import "server-only";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { authEnv } from "@/lib/auth-env";
import { allowAttempt } from "@/features/auth/rate-limit";
import { audit } from "@/features/auth/audit";
import { readSession } from "@/features/auth/session";
export async function validateRequest(scope: string, identity: string, limit: number) {
  const origin = (await headers()).get("origin");
  if (origin !== authEnv().AUTH_ORIGIN) return false;
  const globalAllowed = await allowAttempt("global", "auth", 300);
  const identityAllowed = globalAllowed && await allowAttempt(scope, identity, limit);
  if (!identityAllowed) {
    await db().transaction(async tx => {
      const actor = await readSession(tx);
      await audit(tx, "auth.rate_limited", "denied", actor ?? undefined);
    });
  }
  return identityAllowed;
}
