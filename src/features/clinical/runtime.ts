// Server-only launch assertion: patient booking cannot run with the database owner credentials.
import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { DATABASE_RUNTIME_ROLE, DATABASE_SCOPE } from "@/config/database";
export async function assertClinicalRuntime() {
  const rows = await db().execute(sql`select current_user as name, r.rolsuper as superuser, r.rolcreaterole as create_role,
    r.rolcreatedb as create_database, r.rolbypassrls as bypass_rls,
    pg_get_userbyid(d.datdba) = current_user as database_owner
    from pg_roles r cross join pg_database d where r.rolname = current_user and d.datname = current_database()`);
  const row = rows[0];
  if (!row || row.name !== DATABASE_RUNTIME_ROLE || row.superuser || row.create_role || row.create_database || row.bypass_rls || row.database_owner) {
    throw new Error(`Clinical booking requires the dedicated least-privilege ${DATABASE_RUNTIME_ROLE} database role.`);
  }
  if (DATABASE_SCOPE === "staging") {
    const [boundary] = await db().execute(sql`select
      has_schema_privilege(current_user, 'emcrown_admin', 'USAGE') as live_access,
      has_schema_privilege(current_user, 'public', 'CREATE') as public_create,
      exists(select 1 from pg_auth_members where member = (select oid from pg_roles where rolname = current_user)) as membership`);
    if (!boundary || boundary.live_access || boundary.public_create || boundary.membership) throw new Error("Staging database permissions are not isolated.");
  }
}
