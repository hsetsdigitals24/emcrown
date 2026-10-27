// Server-only database: verified TLS, bounded pool and Supabase transaction-pooler support.
import "server-only";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { authEnv } from "@/lib/auth-env";
import * as schema from "@/lib/db/schema";
import * as clinical from "@/lib/db/clinical";
import { databaseTls } from "@/lib/db/tls";
function createClient() {
  const env = authEnv();
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
export type AuthTransaction = Parameters<Parameters<ReturnType<typeof db>["transaction"]>[0]>[0];
