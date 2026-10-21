// Node-only TLS regressions: full certificate verification remains enabled in every path.
/* eslint-disable @typescript-eslint/no-require-imports -- Reuse the existing TypeScript loader. */
require("../scripts/auth.cjs");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { databaseTls } = require("../src/lib/db/tls.ts");
const certificate = fs.readFileSync("docs/certificates/supabase-root-2021.crt", "utf8").trim();
for (const value of [undefined, "", "  ", certificate, certificate.replaceAll("\n", "\\n")]) {
  const options = databaseTls(value);
  assert.equal(options.rejectUnauthorized, true);
  assert.equal(options.minVersion, "TLSv1.2");
  assert.equal(options.checkServerIdentity, undefined);
  if (value?.trim()) assert.equal(options.ca, certificate);
}
assert.throws(() => databaseTls("invalid-private-input"), error => {
  assert.match(error.message, /DATABASE_CA_CERT/);
  assert.doesNotMatch(error.message, /invalid-private-input/);
  return true;
});
console.log("Passed: verified TLS defaults, explicit CA/escaped PEM support and secret-safe malformed-CA rejection.");
