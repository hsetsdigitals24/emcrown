// Node-only regression tests: environment errors expose field names, never secret values.
/* eslint-disable @typescript-eslint/no-require-imports -- Reuse the standalone TypeScript loader. */
require("../scripts/auth.cjs");
const assert = require("node:assert/strict");
const { validateAuthEnv } = require("../src/lib/auth-env.ts");
const fixture = {
  DATABASE_URL: "postgresql://user:password@localhost:5432/test",
  DATABASE_CA_CERT: "", AUTH_ORIGIN: "http://localhost:3000", AUTH_SECRET: "a".repeat(64),
  SUPER_ADMIN_EMAIL: "owner@example.test", ORGANISATION_NAME: "Test organisation",
  SMTP_HOST: "smtp.example.test", SMTP_PORT: "587", SMTP_USER: "user",
  SMTP_PASSWORD: "test-secret-value", SMTP_FROM: "staff@example.test",
};
assert.equal(validateAuthEnv(fixture).DATABASE_CA_CERT, "");
assert.equal(validateAuthEnv({ ...fixture, DATABASE_CA_CERT: undefined }).DATABASE_CA_CERT, undefined);
for (const sender of ["staff@example.test", "Emcrown Staff <staff@example.test>", '"Emcrown Staff" <staff@example.test>']) {
  assert.equal(validateAuthEnv({ ...fixture, SMTP_FROM: sender }).SMTP_FROM, sender);
}
for (const sender of ["not-an-email", "Emcrown <invalid>", "Staff <staff@example.test>\r\nBcc: other@example.test"]) {
  assert.throws(() => validateAuthEnv({ ...fixture, SMTP_FROM: sender }), /Check: SMTP_FROM/);
}
assert.throws(() => validateAuthEnv({ ...fixture, AUTH_SECRET: "private-invalid-secret" }), error => {
  assert.match(error.message, /AUTH_SECRET/);
  assert.doesNotMatch(error.message, /private-invalid-secret|test-secret-value/);
  return true;
});
console.log("Passed: plain/named SMTP sender, optional blank CA, header-injection rejection and secret-safe configuration errors.");
