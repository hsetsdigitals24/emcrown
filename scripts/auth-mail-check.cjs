// Node-only read-only diagnostic: verify SMTP and queue health without sending email or exposing records.
/* eslint-disable @typescript-eslint/no-require-imports -- Reuse the standalone TypeScript loader. */
require("./auth.cjs");
const nodemailer = require("nodemailer");
const { sql } = require("drizzle-orm");
const { db } = require("../src/lib/db/index.ts");
const { authEnv } = require("../src/lib/auth-env.ts");
let database;
async function main() {
  const env = authEnv();
  const transport = nodemailer.createTransport({
    host: env.SMTP_HOST, port: env.SMTP_PORT, secure: env.SMTP_PORT === 465,
    requireTLS: true, auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD },
    tls: { rejectUnauthorized: true, minVersion: "TLSv1.2" },
    connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 15000,
    disableFileAccess: true, disableUrlAccess: true, logger: false, debug: false,
  });
  try { await transport.verify(); } finally { transport.close(); }
  console.log("SMTP connection, TLS and authentication verified. No email sent.");
  database = db();
  const [health] = await database.execute(sql`
    select count(*) filter (where expires_at > now() and attempts < 5)::int as pending,
      count(*) filter (where expires_at <= now() or attempts >= 5)::int as exhausted
    from emcrown_admin.mail_outbox`);
  const [last] = await database.execute(sql`
    select max(created_at) filter (where outcome = 'success') as accepted,
      max(created_at) filter (where outcome = 'failure') as failed
    from emcrown_admin.audit_events where action = 'auth.reset_email'`);
  console.log(`Pending jobs: ${health.pending}. Expired/exhausted jobs: ${health.exhausted}.`);
  console.log(`Latest SMTP acceptance (UTC): ${last.accepted ? new Date(last.accepted).toISOString() : "none recorded"}.`);
  console.log(`Latest delivery attempt failure (UTC): ${last.failed ? new Date(last.failed).toISOString() : "none recorded"}.`);
  console.log("This check does not prove a scheduler is installed or that a message reached an inbox.");
  if (health.exhausted > 0) process.exitCode = 1;
}
main().catch(() => {
  console.error("Mail verification failed. Check database/SMTP configuration and connectivity; no credentials were logged.");
  process.exitCode = 1;
}).finally(async () => { if (database) await database.$client.end(); });
