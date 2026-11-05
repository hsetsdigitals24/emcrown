// Server-only database: verified TLS, bounded pool and Supabase transaction-pooler support.
import "server-only";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { authEnv } from "@/lib/auth-env";
import * as schema from "@/lib/db/schema";
import * as clinical from "@/lib/db/clinical";
import { databaseTls } from "@/lib/db/tls";
import { DATABASE_SCOPE, DATABASE_RUNTIME_ROLE } from "@/config/database";
import { reviewEmails } from "@/features/clinical/review";
function createClient() {
  const env = authEnv();
  // A staging process must never start application queries using live/owner credentials.
  const username = decodeURIComponent(new URL(env.DATABASE_URL).username).split(".")[0];
  if (DATABASE_SCOPE === "staging" && username !== DATABASE_RUNTIME_ROLE) throw new Error("Staging requires its restricted database login.");
  if (DATABASE_SCOPE === "staging") {
    if (process.env.CLINICAL_REVIEW_MODE !== "true" || process.env.CLINICAL_SMS_ENABLED !== "false") throw new Error("Staging requires email-only engineering review mode.");
    reviewEmails();
  }
  return postgres(env.DATABASE_URL, {
    prepare: false, max: 3, idle_timeout: 20, connect_timeout: 10,
    ssl: databaseTls(env.DATABASE_CA_CERT),
  });
}
// Retain sockets across development hot reloads, while rebuilding Drizzle with current schema.
const development = globalThis as typeof globalThis & { emcrownPostgres?: ReturnType<typeof createClient> };
function createDatabase() {
  const client = process.env.NODE_ENV === "production" ? createClient() : development.emcrownPostgres ??= createClient();
  return drizzle(client, { schema: { ...schema, ...clinical } });
}
let database: ReturnType<typeof createDatabase> | undefined;
export function db() { return database ??= createDatabase(); }
// Lambda closes its own pool before returning, rather than freezing open database sockets.
export async function closeDatabase() {
  if (!database) return;
  await database.$client.end({ timeout: 5 });
  database = undefined;
  if (process.env.NODE_ENV !== "production") development.emcrownPostgres = undefined;
}
export type AuthTransaction = Parameters<Parameters<ReturnType<typeof db>["transaction"]>[0]>[0];
