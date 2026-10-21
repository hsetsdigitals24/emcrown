// Node-only read-only diagnostic: verify database TLS/schema without logging credentials or records.
/* eslint-disable @typescript-eslint/no-require-imports -- Reuse the standalone TypeScript loader. */
require("./auth.cjs");
const { db } = require("../src/lib/db/index.ts");
const { sql } = require("drizzle-orm");
let database;
async function main() {
  database = db();
  const rows = await database.execute(sql`select to_regclass('emcrown_admin.users') is not null as users,
    to_regclass('emcrown_admin.memberships') is not null as memberships,
    to_regclass('emcrown_admin.sessions') is not null as sessions,
    to_regclass('emcrown_admin.audit_events') is not null as audit`);
  console.log("Database connection: verified TLS successful.");
  console.log(Object.values(rows[0]).every(Boolean) ? "Admin schema: present." : "Admin schema: missing/incomplete; run approved migrations before signing in.");
}
main().catch(error => {
  const code = error?.cause?.code ?? error?.code;
  const messages = {
    SELF_SIGNED_CERT_IN_CHAIN: "Database CA is not trusted; configure DATABASE_CA_CERT.",
    UNABLE_TO_VERIFY_LEAF_SIGNATURE: "Database CA chain cannot be verified.",
    ERR_TLS_CERT_ALTNAME_INVALID: "Database hostname does not match its TLS certificate.",
    "28P01": "Database credentials were rejected.", ENOTFOUND: "Database host could not be resolved.",
  };
  console.error(messages[code] ?? "Database check failed; verify configuration and connectivity. No credentials were logged.");
  process.exitCode = 1;
}).finally(async () => { if (database) await database.$client.end(); });
