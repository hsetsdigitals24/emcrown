// Server-only distributed throttling: atomic counters work across serverless instances.
import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { tokenHash } from "@/features/auth/crypto";
import { AUTH_POLICY } from "@/config/auth";
export async function allowAttempt(scope: string, identity: string, limit: number) {
  const key = tokenHash(`${scope}:${identity}`);
  const result = await db().execute<{ attempts: number }>(sql`
    insert into emcrown_admin.rate_limits (key, attempts, expires_at)
    values (${key}, 1, now() + ${AUTH_POLICY.rateSeconds} * interval '1 second')
    on conflict (key) do update set
      attempts = case when rate_limits.expires_at <= now() then 1 else rate_limits.attempts + 1 end,
      expires_at = case when rate_limits.expires_at <= now()
        then now() + ${AUTH_POLICY.rateSeconds} * interval '1 second' else rate_limits.expires_at end
    returning attempts`);
  return result[0].attempts <= limit;
}
