// Node-only configuration regression: errors identify settings without exposing values.
/* eslint-disable @typescript-eslint/no-require-imports -- Existing TypeScript loader. */
require("../scripts/auth.cjs");
const assert = require("node:assert/strict");
const { deliveryEnv } = require("../src/features/clinical/env.ts");

const fixture = {
  CLINICAL_SMTP_HOST: "smtp.example.test",
  CLINICAL_SMTP_PORT: "587",
  CLINICAL_SMTP_USER: "fictional-user",
  CLINICAL_SMTP_PASSWORD: "fictional-secret-password",
  CLINICAL_SMTP_FROM: "sender@example.test",
  CLINICAL_STAFF_EMAIL: "staff@example.test",
  CLINICAL_RETENTION_DAYS: "7",
  CLINICAL_REVIEW_MODE: "true",
  CLINICAL_REVIEW_EMAILS: "staff@example.test",
  CLINICAL_SMS_ENABLED: "false",
};
const previous = Object.fromEntries(Object.keys(fixture).map(name => [name, process.env[name]]));
try {
  Object.assign(process.env, fixture);
  assert.equal(deliveryEnv().CLINICAL_SMTP_PORT, 587);
  for (const name of Object.keys(fixture).slice(0, 7)) {
    delete process.env[name];
    assert.throws(deliveryEnv, { message: `Clinical delivery configuration is incomplete. Missing or invalid settings: ${name}.` });
    process.env[name] = fixture[name];
  }
  Object.assign(process.env, {
    CLINICAL_SMTP_PORT: "private-invalid-port",
    CLINICAL_SMTP_FROM: "Fictional Sender <sender@example.test>",
    CLINICAL_RETENTION_DAYS: "0",
  });
  // Exact message ensures no credentials, email values or raw Zod issues leak.
  assert.throws(deliveryEnv, { message: "Clinical delivery configuration is incomplete. Missing or invalid settings: CLINICAL_SMTP_PORT, CLINICAL_SMTP_FROM, CLINICAL_RETENTION_DAYS." });
  console.log("Clinical environment checks passed: valid settings, missing fields and value-free diagnostics.");
} finally {
  for (const [name, value] of Object.entries(previous)) {
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
  }
}
