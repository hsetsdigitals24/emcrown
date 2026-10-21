// Node-only integration scenarios: isolated local database, no external email.
/* eslint-disable @typescript-eslint/no-require-imports -- Existing test harness. */
const { assert, fs, randomBytes, testUrl, db, migrate, sql, eq, tables, crypto, seedOrganisation, login, readSession, setSessionCookie, createSession, changeTemporaryPassword, verifyMfa, requestReset, resetPassword, allowAttempt, hasPermission, resetSchema, loginSchema } = require("./auth-setup.cjs");
async function prepareDatabase() {
  const postgres = require("postgres");
  const tls = process.env.DATABASE_CA_CERT ? { rejectUnauthorized: true, ca: process.env.DATABASE_CA_CERT } : "verify-full";
  const admin = postgres(testUrl, { ssl: tls, max: 1 });
  const databaseName = `emcrown_auth_test_${Date.now()}`;
  await admin`create database ${admin(databaseName)}`;
  await admin.end();
  const isolatedUrl = new URL(testUrl); isolatedUrl.pathname = `/${databaseName}`;
  process.env.DATABASE_URL = isolatedUrl.toString();
  await migrate(db(), { migrationsFolder: "drizzle" });
  await seedOrganisation();
  const [owner] = await db().select().from(tables.users);
  return { owner, tls, postgres };
}

async function testSignIn(owner) {
  assert.equal(await login("unknown@example.test", "password123"), null);
  assert.equal(await login(owner.email, "wrong password"), null);
  assert.equal(loginSchema.safeParse({ email: "no-email", password: "x" }).success, false);
  assert.equal(resetSchema.safeParse({ token: "x", password: "short", confirmPassword: "short" }).success, false);
  const first = await login(owner.email, "password123");
  assert.equal(first.stage, "password"); await setSessionCookie(first);
  assert.equal(await verifyMfa("123456"), null);
  const changed = await changeTemporaryPassword("A strong replacement 987!");
  assert.equal(changed.stage, "enroll"); await setSessionCookie(changed);
  const enrollment = await readSession();
  const { generate } = require("otplib");
  const code = await generate({ secret: crypto.decrypt(enrollment.enrollmentSecret) });
  const full = await verifyMfa(code); assert.equal(full.stage, "full"); await setSessionCookie(full);
  assert.equal((await readSession()).stage, "full");
  assert.equal(await login(owner.email, "password123"), null);
  assert.equal(hasPermission("staff", "audit:read"), false);
  assert.equal(hasPermission("admin", "members:manage"), false);
  assert.equal(hasPermission("super_admin", "members:manage"), true);
  return code;
}

async function testOrganisationAccess(owner) {
  const { authorisedRead } = require("../src/features/auth/authorize.ts");
  const [membership] = await db().select().from(tables.memberships).where(eq(tables.memberships.userId, owner.id));
  const [otherOrg] = await db().insert(tables.organisations).values({ key: "other", name: "Other organisation" }).returning();
  await db().insert(tables.auditEvents).values({ organisationId: otherOrg.id, action: "portal.viewed", outcome: "success" });
  const view = await authorisedRead("audit:read");
  assert.ok(view.events.length > 0);
  assert.ok(view.events.every(event => event.organisationId === membership.organisationId));
  assert.equal(Object.hasOwn(view.actor, "mfaSecret"), false);
  await db().update(tables.memberships).set({ role: "staff" }).where(eq(tables.memberships.userId, owner.id));
  assert.equal((await authorisedRead("audit:read")).denied, true);
  await db().update(tables.memberships).set({ active: false }).where(eq(tables.memberships.userId, owner.id));
  assert.equal(await readSession(), null);
  await db().update(tables.memberships).set({ role: "super_admin", active: true }).where(eq(tables.memberships.userId, owner.id));
  return membership;
}

async function testReset(owner, code) {
  // A used authenticator step cannot authenticate a second session.
  const second = await login(owner.email, "A strong replacement 987!");
  await setSessionCookie(second); assert.equal(await verifyMfa(code), null);
  await requestReset(owner.email);
  const [job] = await db().select().from(tables.mailOutbox);
  const token = crypto.decrypt(job.payload);
  assert.equal(job.payload.includes(token), false);
  const results = await Promise.all([resetPassword(token, "Another secure password 456!"), resetPassword(token, "Another secure password 456!")]);
  assert.equal(results.filter(Boolean).length, 1);
  assert.equal(await readSession(), null);
  assert.equal((await login(owner.email, "Another secure password 456!")).stage, "mfa");
  await seedOrganisation();
  const [afterSeed] = await db().select().from(tables.users);
  assert.equal(await crypto.verifyPassword("Another secure password 456!", afterSeed.passwordHash), true);
  await requestReset(owner.email);
  const [expired] = await db().select().from(tables.mailOutbox);
  await db().update(tables.resetTokens).set({ createdAt: new Date(Date.now() - 120000), expiresAt: new Date(Date.now() - 60000) });
  assert.equal(await resetPassword(crypto.decrypt(expired.payload), "Another secure password 789!"), false);
  assert.equal(await resetPassword("f".repeat(64), "Another secure password 789!"), false);
  await require("./auth-mail.cjs")(db, tables, requestReset, owner.email);
  return afterSeed;
}

async function testSecurity(owner) {
  const rate = await Promise.all(Array.from({ length: 12 }, () => allowAttempt("test", "account", 5)));
  assert.equal(rate.filter(Boolean).length, 5);
  await assert.rejects(db().execute(sql`update emcrown_admin.audit_events set outcome = 'success'`));
  await assert.rejects(db().execute(sql`delete from emcrown_admin.audit_events`));
  await assert.rejects(db().execute(sql`truncate emcrown_admin.audit_events`));
  await assert.rejects(db().insert(tables.users).values({ email: "INVALID", passwordHash: owner.passwordHash }));
  await assert.rejects(db().insert(tables.users).values({ email: "valid@example.test", passwordHash: "plaintext" }));
  const [event] = await db().select().from(tables.auditEvents).limit(1);
  assert.equal(Object.hasOwn(event, "password"), false);
  const tampered = crypto.encrypt("secret").split("."); tampered[1] = randomBytes(16).toString("base64url");
  assert.throws(() => crypto.decrypt(tampered.join(".")));
  const session = await login(owner.email, "Another secure password 456!"); await setSessionCookie(session);
  await db().update(tables.sessions).set({ createdAt: new Date(Date.now() - 120000), expiresAt: new Date(Date.now() - 60000) });
  assert.equal(await readSession(), null);
}

async function testRuntime(owner, membership, afterSeed, tls, postgres) {
  const databaseName = new URL(process.env.DATABASE_URL).pathname.slice(1);
  const idle = await db().transaction(tx => createSession(tx, owner.id, membership.organisationId, "full"));
  await setSessionCookie(idle);
  await db().update(tables.sessions).set({ lastSeenAt: new Date(Date.now() - 31 * 60000) }).where(eq(tables.sessions.tokenHash, crypto.tokenHash(idle.token)));
  assert.equal(await readSession(), null);
  await db().transaction(async tx => {
    await tx.execute(sql`create role ${sql.identifier(`runtime_${databaseName}`)} login`);
    await tx.execute(sql.raw(fs.readFileSync("docs/ADMIN_RUNTIME_GRANTS.sql", "utf8").replaceAll("emcrown_runtime", `runtime_${databaseName}`)));
  });
  const runtimeUrl = new URL(process.env.DATABASE_URL); runtimeUrl.username = `runtime_${databaseName}`;
  const runtime = postgres(runtimeUrl.toString(), { ssl: tls, max: 1 });
  await runtime`select id from emcrown_admin.organisations`;
  await assert.rejects(runtime`update emcrown_admin.audit_events set outcome='success'`);
  await assert.rejects(runtime`update emcrown_admin.memberships set role='super_admin'`);
  await assert.rejects(runtime`create table emcrown_admin.unapproved (id int)`);
  await runtime.end();
  // Optional local browser fixture contains test-only secrets and is owner-readable.
  if (process.env.AUTH_BROWSER_FIXTURE) fs.writeFileSync(process.env.AUTH_BROWSER_FIXTURE, JSON.stringify({
    env: { ...Object.fromEntries(["AUTH_SECRET", "AUTH_ORIGIN", "SUPER_ADMIN_EMAIL", "ORGANISATION_NAME", "DATABASE_CA_CERT",
      "SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASSWORD", "SMTP_FROM"].map(key => [key, process.env[key]])), DATABASE_URL: runtimeUrl.toString() },
    email: owner.email, password: "Another secure password 456!", mfaSecret: crypto.decrypt(afterSeed.mfaSecret),
  }), { mode: 0o600 });
  assert.equal(fs.readFileSync(".env.example", "utf8").includes("SUPER_ADMIN_EMAIL="), true);
  console.log("Passed: hashing/validation, staged login, MFA/replay, reset concurrency/expiry, session revocation/idle expiry, idempotent seed, atomic throttling, tenant isolation, role revocation, least-privilege grants, database constraints and immutable audit.");}

async function main() {
  const { owner, tls, postgres } = await prepareDatabase();
  const code = await testSignIn(owner);
  const membership = await testOrganisationAccess(owner);
  const afterSeed = await testReset(owner, code);
  await testSecurity(owner);
  await testRuntime(owner, membership, afterSeed, tls, postgres);
}

main().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => { await db().$client.end(); });
