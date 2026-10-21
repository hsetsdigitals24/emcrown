// Node-only regression: rejected SMTP recipients retain their reset job for retry.
/* eslint-disable @typescript-eslint/no-require-imports -- Reuse the standalone TypeScript loader. */
require("../scripts/auth.cjs");
const assert = require("node:assert/strict");
const Module = require("node:module");
const tables = require("../src/lib/db/schema.ts");
const original = Module._load;
let response;
let claimed;
let deleted;
let retried;
let outcome;
const tx = {
  select: () => ({ from: table => ({ where: () => {
    if (table === tables.users) return [{ id: "test", active: true, email: "owner@example.test" }];
    if (table === tables.memberships) return [{ userId: "test", organisationId: "test", role: "super_admin" }];
    return { orderBy: () => ({ for: () => ({ limit: async () => {
      if (claimed) return [];
      claimed = true;
      return [{ id: "test-job", userId: "test", payload: "encrypted", attempts: 0 }];
    } }) }) };
  } }) }),
  delete: () => ({ where: async () => { deleted = true; } }),
  update: () => ({ set: () => ({ where: async () => { retried = true; } }) }),
};
Module._load = function(name, ...args) {
  if (name === "nodemailer") return { createTransport: () => ({ sendMail: async () => response }) };
  if (name === "@/lib/db") return { db: () => ({ transaction: callback => callback(tx) }) };
  if (name === "@/lib/auth-env") return { authEnv: () => ({ SMTP_PORT: 587, AUTH_ORIGIN: "https://example.test" }) };
  if (name === "@/features/auth/crypto") return { decrypt: () => "test-only-token" };
  if (name === "@/features/auth/cleanup") return { cleanExpiredAuthData: async () => {} };
  if (name === "@/features/auth/audit") return { audit: async (_tx, _action, result) => { outcome = result; } };
  return original.call(this, name, ...args);
};
async function main() {
  const { deliverResetEmails } = require("../src/features/auth/mail.ts");
  for (const accepted of [true, false]) {
    claimed = deleted = retried = false;
    response = accepted ? { accepted: ["owner@example.test"], rejected: [] }
      : { accepted: [], rejected: ["owner@example.test"] };
    await deliverResetEmails();
    assert.equal(deleted, accepted);
    assert.equal(retried, !accepted);
    assert.equal(outcome, accepted ? "success" : "failure");
  }
  console.log("Passed: SMTP acceptance removes the job; recipient rejection retries and audits failure. No email sent.");
}
main().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => { Module._load = original; });
