// Server-only launch assertion: patient booking cannot run with the database owner credentials.
import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
export async function assertClinicalRuntime() {
  const rows = await db().execute(sql`select current_user as name, r.rolsuper as superuser, r.rolcreaterole as create_role,
    r.rolcreatedb as create_database, r.rolbypassrls as bypass_rls,
    pg_get_userbyid(d.datdba) = current_user as database_owner
    from pg_roles r cross join pg_database d where r.rolname = current_user and d.datname = current_database()`);
  const row = rows[0];
  if (!row || row.name !== "emcrown_runtime" || row.superuser || row.create_role || row.create_database || row.bypass_rls || row.database_owner) {
    throw new Error("Live clinical booking requires the dedicated least-privilege emcrown_runtime database role.");
  }
}
