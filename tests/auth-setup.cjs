// Node-only auth integration tests: use an isolated local PostgreSQL database with verified TLS.
/* eslint-disable @typescript-eslint/no-require-imports -- Existing TypeScript loader. */
require("../scripts/auth.cjs");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const Module = require("node:module");
const { randomBytes } = require("node:crypto");
const testUrl = process.env.AUTH_TEST_DATABASE_URL;
if (!testUrl || !["localhost", "127.0.0.1"].includes(new URL(testUrl).hostname) || !new URL(testUrl).pathname.startsWith("/emcrown_auth_test")) {
  throw new Error("Use a dedicated local emcrown_auth_test database; remote databases are rejected.");
}
Object.assign(process.env, {
  DATABASE_URL: testUrl, AUTH_ORIGIN: "http://localhost:3000", AUTH_SECRET: randomBytes(32).toString("hex"),
  SUPER_ADMIN_EMAIL: "owner@example.test", SUPER_ADMIN_INITIAL_PASSWORD: "password123", ORGANISATION_NAME: "Test organisation",
  SMTP_HOST: "localhost", SMTP_PORT: "587", SMTP_USER: "test", SMTP_PASSWORD: "test", SMTP_FROM: "staff@example.test",
});
const jar = new Map();
const load = Module._load;
Module._load = function(name, ...args) {
  if (name === "next/headers") return { cookies: async () => ({
    get: key => jar.has(key) ? { value: jar.get(key) } : undefined,
    set: (key, value) => jar.set(key, value), delete: key => jar.delete(key),
  }), headers: async () => new Headers({ origin: process.env.AUTH_ORIGIN }) };
  if (name === "next/navigation") return { redirect: location => { throw new Error(`redirect:${location}`); } };
  return load.call(this, name, ...args);
};
const { db } = require("../src/lib/db/index.ts");
const { migrate } = require("drizzle-orm/postgres-js/migrator");
const { sql, eq } = require("drizzle-orm");
const tables = require("../src/lib/db/schema.ts");
const crypto = require("../src/features/auth/crypto.ts");
const { seedOrganisation } = require("../src/features/auth/seed.ts");
const { login } = require("../src/features/auth/login.ts");
const { readSession, setSessionCookie, createSession } = require("../src/features/auth/session.ts");
const { changeTemporaryPassword, verifyMfa } = require("../src/features/auth/challenges.ts");
const { requestReset, resetPassword } = require("../src/features/auth/passwords.ts");
const { allowAttempt } = require("../src/features/auth/rate-limit.ts");
const { hasPermission } = require("../src/config/auth.ts");
const { resetSchema, loginSchema } = require("../src/features/auth/validation.ts");
module.exports = { assert, fs, randomBytes, testUrl, db, migrate, sql, eq, tables, crypto, seedOrganisation, login, readSession, setSessionCookie, createSession, changeTemporaryPassword, verifyMfa, requestReset, resetPassword, allowAttempt, hasPermission, resetSchema, loginSchema };
