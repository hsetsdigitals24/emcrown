// Node-only integration: isolated local database; no real accounts or email delivery.
/* eslint-disable @typescript-eslint/no-require-imports -- Existing auth test loader. */
const { assert, testUrl, db, migrate, sql, eq, tables, crypto, seedOrganisation, login,
  readSession, setSessionCookie, createSession, verifyMfa } = require("./auth-setup.cjs");
const { inviteMember, acceptInvitation } = require("../src/features/auth/invitations.ts");
const { generateRecoveryCodes, recoverAuthenticator } = require("../src/features/auth/recovery.ts");
const { transferOwnership } = require("../src/features/auth/ownership.ts");
const { clearSessionCookie } = require("../src/features/auth/session.ts");
const { generate, generateSecret } = require("otplib");
const postgres = require("postgres");
let tls;
async function session(userId, organisationId, stage = "full") {
  const value = await db().transaction(tx => createSession(tx, userId, organisationId, stage));
  await setSessionCookie(value); return value;
}
async function nextCode(userId) {
  // Reset replay state only in this isolated fixture to avoid wall-clock waits.
  await db().update(tables.users).set({ lastMfaStep: -1 }).where(eq(tables.users.id, userId));
  const [user] = await db().select().from(tables.users).where(eq(tables.users.id, userId));
  return generate({ secret: crypto.decrypt(user.mfaSecret) });
}
async function prepare() {
  tls = process.env.DATABASE_CA_CERT ? { rejectUnauthorized: true, ca: process.env.DATABASE_CA_CERT } : "verify-full";
  const admin = postgres(testUrl, { ssl: tls, max: 1 });
  const name = `emcrown_auth_test_handover_${Date.now()}`;
  await admin`create database ${admin(name)}`; await admin.end();
  const url = new URL(testUrl); url.pathname = `/${name}`; process.env.DATABASE_URL = url.toString();
  await migrate(db(), { migrationsFolder: "drizzle" }); await seedOrganisation();
  const [owner] = await db().select().from(tables.users);
  const [membership] = await db().select().from(tables.memberships);
  await db().update(tables.users).set({ mustChangePassword: false, mfaSecret: crypto.encrypt(generateSecret()) }).where(eq(tables.users.id, owner.id));
  return { owner, org: membership.organisationId };
}
async function invitations(owner, org) {
  await session(owner.id, org);
  assert.equal(await inviteMember("client@example.test", "000000"), false);
  assert.equal(await inviteMember("client@example.test", await nextCode(owner.id)), true);
  assert.equal(await login("client@example.test", "password123"), null);
  const [old] = await db().select().from(tables.mailOutbox);
  assert.equal(old.kind, "invitation");
  const oldToken = crypto.decrypt(old.payload);
  const Module = require("node:module");
  const originalLoad = Module._load;
  const messages = [];
  Module._load = function(name, ...args) {
    if (name === "nodemailer") return { createTransport: () => ({ sendMail: async message => {
      messages.push(message); return { accepted: [message.to], rejected: [] };
    } }) };
    return originalLoad.call(this, name, ...args);
  };
  try { await require("../src/features/auth/mail.ts").deliverResetEmails(); }
  finally { Module._load = originalLoad; }
  assert.equal(messages.length, 1);
  assert.match(messages[0].text, /accept-invitation#token=[a-f0-9]{64}/);
  assert.equal((await db().select().from(tables.mailOutbox)).length, 0);
  await db().update(tables.invitations).set({ expiresAt: new Date(Date.now() - 1000) });
  await clearSessionCookie();
  assert.equal(await acceptInvitation(oldToken, "Client private password 123!"), null, "expired invitation rejected");
  await session(owner.id, org);
  assert.equal(await inviteMember("client@example.test", await nextCode(owner.id)), true);
  const [job] = await db().select().from(tables.mailOutbox);
  assert.notEqual(job.payload, old.payload);
  assert.equal(await acceptInvitation(crypto.decrypt(job.payload), "Client private password 123!"), null, "signed-in account cannot accept");
  await clearSessionCookie();
  assert.equal(await acceptInvitation(oldToken, "Client private password 123!"), null);
  const token = crypto.decrypt(job.payload);
  const accepted = await Promise.all([acceptInvitation(token, "Client private password 123!"), acceptInvitation(token, "Client private password 123!")]);
  assert.equal(accepted.filter(Boolean).length, 1);
  await setSessionCookie(accepted.find(Boolean));
  const enrolling = await readSession();
  assert.equal(enrolling.stage, "enroll");
  const full = await verifyMfa(await generate({ secret: crypto.decrypt(enrolling.enrollmentSecret) }));
  await setSessionCookie(full);
  const client = await readSession();
  assert.equal(client.stage, "full"); assert.equal(client.role, "staff");
  assert.equal(await acceptInvitation(token, "Different password 123!"), null);
  return client;
}
async function recovery(client, org) {
  const code = await nextCode(client.userId);
  const codes = await generateRecoveryCodes(code);
  assert.equal(codes.length, 10);
  assert.equal(await generateRecoveryCodes(code), null, "step-up MFA replay rejected");
  const stored = await db().select().from(tables.recoveryCodes);
  assert.ok(stored.every(row => !codes.includes(row.tokenHash)));
  assert.equal(await recoverAuthenticator(codes[0].replaceAll("-", "")), null, "full sessions cannot recover");
  const challenge = await login("client@example.test", "Client private password 123!");
  assert.equal(challenge.stage, "mfa"); await setSessionCookie(challenge);
  assert.equal(await recoverAuthenticator("f".repeat(32)), null);
  const recovered = await Promise.all([recoverAuthenticator(codes[0].replaceAll("-", "")), recoverAuthenticator(codes[0].replaceAll("-", ""))]);
  assert.equal(recovered.filter(Boolean).length, 1);
  assert.equal((await db().select().from(tables.recoveryCodes)).length, 0);
  await setSessionCookie(recovered.find(Boolean));
  const enrollment = await readSession(); assert.equal(enrollment.stage, "enroll");
  const full = await verifyMfa(await generate({ secret: crypto.decrypt(enrollment.enrollmentSecret) }));
  await setSessionCookie(full); assert.equal((await readSession()).organisationId, org);
}
async function handover(owner, client, org) {
  await session(owner.id, org);
  const [otherOrg] = await db().insert(tables.organisations).values({ key: "other-handover", name: "Other" }).returning();
  const [outsider] = await db().insert(tables.users).values({ email: "outside@example.test", passwordHash: owner.passwordHash, mustChangePassword: false, mfaSecret: crypto.encrypt(generateSecret()) }).returning();
  await db().insert(tables.memberships).values({ organisationId: otherOrg.id, userId: outsider.id, role: "staff" });
  assert.equal(await transferOwnership(outsider.id, await nextCode(owner.id)), false, "cross-tenant target rejected");
  await db().update(tables.users).set({ mfaSecret: null }).where(eq(tables.users.id, outsider.id));
  await db().insert(tables.memberships).values({ organisationId: org, userId: outsider.id, role: "staff" });
  assert.equal(await transferOwnership(outsider.id, await nextCode(owner.id)), false, "target without MFA rejected");
  assert.equal(await transferOwnership(owner.id, await nextCode(owner.id)), false, "self transfer rejected");
  assert.equal(await transferOwnership(client.userId, "000000"), false);
  const fresh = await nextCode(owner.id);
  const outcomes = await Promise.all([transferOwnership(client.userId, fresh), transferOwnership(client.userId, fresh)]);
  assert.equal(outcomes.filter(Boolean).length, 1);
  assert.equal(await readSession(), null);
  const [state] = await db().select().from(tables.ownership).where(eq(tables.ownership.organisationId, org));
  assert.equal(state.ownerId, client.userId); assert.ok(state.transferredAt);
  const transfers = await db().select().from(tables.auditEvents).where(eq(tables.auditEvents.action, "ownership.transferred"));
  const successful = transfers.filter(event => event.outcome === "success");
  assert.equal(successful.length, 1); assert.equal(successful[0].actorId, owner.id);
  const [oldMember] = await db().select().from(tables.memberships).where(eq(tables.memberships.userId, owner.id));
  assert.equal(oldMember.active, false);
  await session(client.userId, org);
  assert.equal(await transferOwnership(outsider.id, await nextCode(client.userId)), false, "second transfer permanently blocked");
  await assert.rejects(db().update(tables.ownership).set({ transferredAt: null }).where(eq(tables.ownership.organisationId, org)));
  await seedOrganisation();
  const [after] = await db().select().from(tables.ownership).where(eq(tables.ownership.organisationId, org));
  assert.equal(after.ownerId, client.userId); assert.ok(after.transferredAt);
  const role = `handover_runtime_${Date.now()}`;
  await db().execute(sql.raw(`create role ${role} login`));
  await db().execute(sql.raw(require("node:fs").readFileSync("docs/ADMIN_RUNTIME_GRANTS.sql", "utf8").replaceAll("emcrown_runtime", role)));
  const url = new URL(process.env.DATABASE_URL); url.username = role;
  const runtime = postgres(url.toString(), { ssl: tls, max: 1 });
  try {
    await assert.rejects(runtime`update emcrown_admin.memberships set role='super_admin'`);
    await assert.rejects(runtime`update emcrown_admin.ownership set transferred_at=null`);
    await assert.rejects(runtime`truncate emcrown_admin.ownership`);
    const [{ result }] = await runtime`select emcrown_admin.transfer_ownership(${'0'.repeat(64)}, ${outsider.id}::uuid) as result`;
    assert.equal(result, false);
  } finally { await runtime.end(); }
}
async function main() {
  const { owner, org } = await prepare();
  const client = await invitations(owner, org);
  await recovery(client, org);
  await handover(owner, client, org);
  console.log("Passed: expiring/rotated single-use invitations, mandatory MFA, recovery replay/races, tenant isolation, fresh MFA, atomic handover, old-access revocation, permanent latch and runtime permissions. No email sent.");
}
main().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => { await db().$client.end(); });
