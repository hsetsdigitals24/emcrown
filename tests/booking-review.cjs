// Node-only review-mode regressions: approval separation and recipient checks without external calls.
/* eslint-disable @typescript-eslint/no-require-imports -- Existing server TypeScript loader. */
require("../scripts/auth.cjs");
const assert = require("node:assert/strict");
const { randomBytes } = require("node:crypto");
Object.assign(process.env, {
  CLINICAL_REVIEW_MODE: "true", CLINICAL_REVIEW_EMAILS: "reviewer@example.test, STAFF@example.test ",
  CLINICAL_BOOKING_ENABLED: "true", CLINICAL_INTEGRATIONS_APPROVED: "false", CLINICAL_RETENTION_DAYS: "7",
  CLINICAL_SMTP_HOST: "localhost", CLINICAL_SMTP_PORT: "587", CLINICAL_SMTP_USER: "test",
  CLINICAL_SMTP_PASSWORD: "test", CLINICAL_SMTP_FROM: "staff@example.test", CLINICAL_STAFF_EMAIL: "staff@example.test",
  CLINICAL_SMS_ENABLED: "false", TURNSTILE_SITE_KEY: "fixture-site-key", TURNSTILE_SECRET_KEY: "fixture-secret-key",
  CLINICAL_ACTIVE_KEY: "test", CLINICAL_ENCRYPTION_KEYS: JSON.stringify({ test: randomBytes(32).toString("hex") }),
  CLINICAL_TOKEN_KEY: randomBytes(32).toString("hex"),
});
async function main() {
  const { liveBookingConfigured, deliveryEnv } = require("../src/features/clinical/env.ts");
  const { reviewRecipientAllowed } = require("../src/features/clinical/review.ts");
  assert.equal(liveBookingConfigured(), true);
  assert.equal(process.env.CLINICAL_INTEGRATIONS_APPROVED, "false");
  assert.equal(reviewRecipientAllowed("REVIEWER@example.test"), true);
  assert.equal(reviewRecipientAllowed("staff@example.test"), true);
  assert.equal(reviewRecipientAllowed("patient@example.test"), false);
  process.env.CLINICAL_REVIEW_EMAILS = "";
  assert.equal(liveBookingConfigured(), false);
  process.env.CLINICAL_REVIEW_EMAILS = "reviewer@example.test";
  process.env.CLINICAL_SMS_ENABLED = "true";
  assert.throws(deliveryEnv);
  process.env.CLINICAL_SMS_ENABLED = "false";
  const { deliverMessage } = require("../src/features/appointments/delivery.ts");
  await assert.rejects(deliverMessage("test", "email", { to: "patient@example.test", text: "fixture" }), /recipient/);
  await assert.rejects(deliverMessage("test", "sms", { to: "+12025550110", text: "fixture" }), /recipient/);
  process.env.CLINICAL_REVIEW_MODE = "false";
  assert.equal(liveBookingConfigured(), false);
  process.env.CLINICAL_INTEGRATIONS_APPROVED = "true";
  assert.equal(liveBookingConfigured(), true);
  process.env.CLINICAL_BOOKING_ENABLED = "false";
  assert.equal(liveBookingConfigured(), false);
  console.log("Booking review checks passed: explicit opt-in, separate launch approval, strict reviewer emails, SMS disabled and outbound recipient enforcement.");
}
main().catch(() => { console.error("Booking review checks failed."); process.exitCode = 1; });
