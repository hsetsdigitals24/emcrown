// Pure connection-construction checks: fictional credentials only; no psql process or database connection.
/* eslint-disable @typescript-eslint/no-require-imports */
const assert=require("node:assert/strict");
const {consoleSettings}=require("../scripts/staging-console.cjs");
const settings=consoleSettings("postgres://postgres.fictional:fake%3Apass%5Cword@pooler.example.test:6543/postgres","/tmp/public-ca.crt",{
  PATH:"/usr/bin",PGHOST:"localhost",PGDATABASE:"wrong",PGSERVICE:"wrong",PGOPTIONS:"unsafe",PGPASSWORD:"old",PGSSLMODE:"disable"});
assert.equal(settings.env.PGHOST,"pooler.example.test");assert.equal(settings.env.PGUSER,"postgres.fictional");
assert.equal(settings.env.PGPASSWORD,"fake:pass\\word");assert.equal(settings.env.PGPORT,"6543");
assert.equal(settings.env.PGDATABASE,"postgres");assert.equal(settings.env.PGSSLMODE,"verify-full");
assert.equal(settings.env.PGSSLROOTCERT,"/tmp/public-ca.crt");assert.equal(settings.env.PGSERVICE,undefined);assert.equal(settings.env.PGOPTIONS,undefined);
assert.ok(!settings.args.join(" ").includes(settings.env.PGPASSWORD));assert.ok(settings.args.includes("-X"));
assert.throws(()=>consoleSettings("http://example.test","/tmp/ca"));assert.throws(()=>consoleSettings("postgres://user@localhost/db","/tmp/ca"));
console.log("Staging console checks passed: explicit target, escaped credentials, TLS enforced, conflicting PG settings excluded and no password arguments.");
