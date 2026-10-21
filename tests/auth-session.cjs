// Node-only access regressions: signed-out requests must not initialize or connect to PostgreSQL.
/* eslint-disable @typescript-eslint/no-require-imports -- Reuse the existing TypeScript loader. */
require("../scripts/auth.cjs");
const assert = require("node:assert/strict");
const Module = require("node:module");
const load = Module._load;
let token;
let databaseCalls = 0;
Module._load = function(name, ...args) {
  if (name === "@/lib/db") return { db: () => { databaseCalls++; throw new Error("Database required"); } };
  if (name === "next/headers") return { cookies: async () => ({ get: () => token ? { value: token } : undefined }) };
  if (name === "next/navigation") return { redirect: location => { throw new Error(`redirect:${location}`); } };
  return load.call(this, name, ...args);
};
const { readSession } = require("../src/features/auth/session.ts");
const { authorisedRead } = require("../src/features/auth/authorize.ts");
async function main() {
  for (const value of [undefined, "malformed", "a".repeat(63), "z".repeat(64)]) {
    token = value;
    assert.equal(await readSession(), null);
    await assert.rejects(authorisedRead("portal:read"), /redirect:\/emcrown-admin\/login/);
    assert.equal(databaseCalls, 0);
  }
  token = "a".repeat(64);
  await assert.rejects(readSession(), /Database required/);
  assert.equal(databaseCalls, 1);
  console.log("Passed: absent/malformed cookies skip database access; valid-shaped tokens still require database verification.");
}
main().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => { Module._load = load; });
