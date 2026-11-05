// Server-only readiness: check metadata privileges without reading patient data or claiming email jobs.
import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { DATABASE_SCHEMA } from "@/config/database";
import { assertClinicalRuntime } from "@/features/clinical/runtime";
const permissions = [
  ["users", "SELECT"], ["memberships", "SELECT"], ["invitations", "SELECT"],
  ["organisations", "SELECT"], ["sessions", "SELECT,DELETE"], ["reset_tokens", "SELECT,DELETE"],
  ["rate_limits", "SELECT,DELETE"], ["mail_outbox", "SELECT,UPDATE,DELETE"], ["audit_events", "INSERT"],
  ["appointments", "SELECT,UPDATE"], ["physicians", "SELECT"],
  ["appointment_messages", "SELECT,UPDATE"], ["appointment_events", "INSERT"], ["sms_suppressions", "SELECT"],
];
export async function assertWorkerRuntime() {
  await assertClinicalRuntime();
  const checks = permissions.flatMap(([table, operations]) => operations.split(",").map(operation => sql`(${`${DATABASE_SCHEMA}.${table}`}, ${operation})`));
  const rows = await db().execute(sql`select has_table_privilege(current_user, resource, privilege) as allowed
    from (values ${sql.join(checks, sql`, `)}) as required(resource, privilege)
    union all select has_schema_privilege(current_user, ${DATABASE_SCHEMA}, 'USAGE')`);
  if (rows.some(row => row.allowed !== true)) throw new Error("Email worker database permissions are incomplete.");
}
