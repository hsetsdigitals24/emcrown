// Node integration: isolated local database only; validate publishing, concurrency and privacy.
/* eslint-disable @typescript-eslint/no-require-imports -- Reuse the project's TypeScript test loader. */
const { assert, testUrl, db, migrate, sql, eq, tables, crypto, seedOrganisation, createSession, setSessionCookie } = require("./auth-setup.cjs");
const postgres = require("postgres");
const { generateSecret } = require("otplib");
const { CMS_DEFINITIONS, findDefinition } = require("../src/config/cms/registry.ts");
const { validateValues, isSafeLink, storedValues } = require("../src/features/cms/validation.ts");
const { applyContent } = require("../src/features/cms/fields.ts");
const { loadCms, mutateCms } = require("../src/features/cms/repository.ts");
const Module = require("node:module");
const originalLoad = Module._load;
Module._load = function(name, ...args) {
  if (name === "next/cache") return { unstable_cache: callback => callback };
  return originalLoad.call(this, name, ...args);
};
const { publicValues } = require("../src/features/cms/public.ts");
const { uploadMedia, readMedia, rasterType, mediaBytes } = require("../src/features/cms/media.ts");
const { clearSessionCookie } = require("../src/features/auth/session.ts");
const sharp = require("sharp");
// Exercise real normalization and database metadata without touching remote Storage.
const storage = require("../src/lib/storage.ts");
const objects = new Map();
storage.storeImage = async (path, data) => { objects.set(path, data); };
storage.loadImage = async path => { assert.ok(objects.has(path)); return objects.get(path); };
storage.deleteImage = async path => { objects.delete(path); };
async function session(userId, organisationId) {
  const value = await db().transaction(tx => createSession(tx, userId, organisationId, "full"));
  await setSessionCookie(value);
  return value;
}
async function prepare() {
  const tls = process.env.DATABASE_CA_CERT ? { rejectUnauthorized: true, ca: process.env.DATABASE_CA_CERT } : "verify-full";
  const admin = postgres(testUrl, { ssl: tls, max: 1 });
  const name = `emcrown_auth_test_cms_${Date.now()}`;
  await admin`create database ${admin(name)}`; await admin.end();
  const url = new URL(testUrl); url.pathname = `/${name}`; process.env.DATABASE_URL = url.toString();
  await migrate(db(), { migrationsFolder: "drizzle" }); await seedOrganisation();
  const [owner] = await db().select().from(tables.users);
  const [membership] = await db().select().from(tables.memberships);
  await db().update(tables.users).set({ mustChangePassword: false, mfaSecret: crypto.encrypt(generateSecret()) }).where(eq(tables.users.id, owner.id));
  return { owner, org: membership.organisationId };
}
function validation() {
  for (const definition of CMS_DEFINITIONS) assert.ok(validateValues(definition.path, definition.initial), `Invalid seed: ${definition.path}`);
  const seed = findDefinition("/").initial;
  const previous = { ...seed, retired: "An old field" }; delete previous["hero.headline"];
  assert.equal(storedValues("/", previous)["hero.headline"], seed["hero.headline"]);
  assert.equal(storedValues("/", previous).retired, undefined);
  assert.equal(validateValues("/", { ...seed, "__proto__.bad": "bad" }), null);
  assert.equal(validateValues("/", { ...seed, "hero.media.photo": "https://tracker.example/image.jpg" }), null);
  assert.equal(validateValues("/", { ...seed, "hero.media.photo": "/media/../../secret.jpg" }), null);
  assert.equal(validateValues("/", { ...seed, "hero.buttonLink": "javascript:alert(1)" }), null);
  assert.equal(validateValues("/", { ...seed, "hero.headline": "a".repeat(20001) }), null);
  assert.equal(validateValues("/missing", seed), null);
  for (const link of ["javascript:alert(1)", "//evil.example", "/\\evil.example", "data:text/html,hi", "https://example.test/\n"]) assert.equal(isSafeLink(link), false);
  for (const link of ["/about", "#faq", "https://example.test/path", "tel:+12125551234", "mailto:staff@example.test"]) assert.equal(isSafeLink(link), true);
  const original = { hero: { headline: "Old", id: "hero" }, sections: [{ body: "Original" }] };
  assert.deepEqual(applyContent(original, { "hero.headline": "New", "sections.0.body": "Changed" }), { hero: { headline: "New", id: "hero" }, sections: [{ body: "Changed" }] });
  assert.equal(original.hero.headline, "Old");
}
async function publishing(owner, org) {
  await clearSessionCookie(); assert.equal((await loadCms("/")).code, "denied");
  await session(owner.id, org);
  const initial = await loadCms("/"); assert.equal(initial.snapshot.version, 0);
  const values = { ...initial.snapshot.values, "hero.headline": "Draft for testing" };
  let result = await mutateCms({ path: "/", operation: "save", version: 0, values });
  assert.equal(result.ok, true); assert.equal(result.snapshot.published, false);
  assert.equal(await publicValues("/"), undefined, "Saving a first draft preserves the starter page");
  assert.equal((await mutateCms({ path: "/", operation: "save", version: 0, values })).code, "conflict");
  result = await mutateCms({ path: "/", operation: "publish", version: 1, values });
  assert.equal(result.ok, true); assert.equal((await publicValues("/"))["hero.headline"], "Draft for testing");
  const revisionId = result.revisions.find(revision => revision.action === "initial").id;
  result = await mutateCms({ path: "/", operation: "restore", version: 2, revisionId });
  assert.equal(result.snapshot.values["hero.headline"], initial.snapshot.values["hero.headline"]);
  assert.equal((await publicValues("/"))["hero.headline"], "Draft for testing", "Restore must not publish");
  result = await mutateCms({ path: "/", operation: "unpublish", version: 3 });
  assert.equal(result.ok, true); assert.equal(await publicValues("/"), null);
  const concurrent = await Promise.all(["One", "Two"].map(headline => mutateCms({ path: "/", operation: "save", version: 4, values: { ...values, "hero.headline": headline } })));
  assert.equal(concurrent.filter(value => value.ok).length, 1);
  assert.equal(concurrent.filter(value => value.code === "conflict").length, 1);
  assert.equal(await publicValues("/"), null, "Saving after unpublish must not restore the live page");
  assert.equal((await mutateCms({ path: "/_site", operation: "unpublish", version: 0 })).code, "invalid");
  await assert.rejects(db().execute(sql`update emcrown_admin.cms_revisions set action = 'save'`));
}
async function permissions(owner, org) {
  const [staff] = await db().insert(tables.users).values({ email: "editor@example.test", passwordHash: await crypto.hashPassword("TestPasswordOnly123"),
    mustChangePassword: false, mfaSecret: crypto.encrypt(generateSecret()) }).returning();
  await db().insert(tables.memberships).values({ userId: staff.id, organisationId: org, role: "staff" });
  await session(staff.id, org);
  const values = findDefinition("/about").initial;
  assert.equal((await mutateCms({ path: "/about", operation: "publish", version: 0, values })).code, "denied");
  assert.equal((await mutateCms({ path: "/about", operation: "save", version: 0, values })).ok, true);
  const [other] = await db().insert(tables.organisations).values({ name: "Other test organisation", key: "cms-test-other" }).returning();
  await db().insert(tables.memberships).values({ userId: owner.id, organisationId: other.id, role: "admin" });
  await session(owner.id, other.id);
  assert.equal((await loadCms("/about")).snapshot.version, 0);
  assert.equal((await mutateCms({ path: "/about", operation: "restore", version: 0, revisionId: (await db().select().from(tables.cmsRevisions))[0].id })).code, "invalid");
  await session(owner.id, org);
}
async function media() {
  const png = await sharp({ create: { width: 2200, height: 100, channels: 3, background: "blue" } }).png().toBuffer();
  assert.equal(rasterType(Buffer.from("<svg>bad</svg>")), null);
  assert.equal(rasterType(Buffer.alloc(3 * 1024 * 1024 + 1)), null);
  const url = await uploadMedia(png); assert.ok(url);
  const id = url.split("/").at(-1).split(".")[0];
  const stored = await readMedia(id, url); assert.ok(stored); assert.equal(stored.contentType, "image/webp");
  assert.equal(stored.data, ""); assert.ok(stored.storagePath);
  const metadata = await sharp(await mediaBytes(stored)).metadata();
  assert.ok(metadata.width <= 1600); assert.equal(metadata.exif, undefined);
  await clearSessionCookie();
  assert.equal(await readMedia(id, url), null, "Draft media must stay private");
}
(async () => {
  validation(); const { owner, org } = await prepare();
  await publishing(owner, org); await permissions(owner, org); await media();
  console.log("CMS passed: seed/input validation, safe links, draft isolation, publish/unpublish, restore, immutable history, concurrent conflicts, roles, tenant isolation and private media.");
})().then(() => process.exit(0)).catch(error => { console.error(error); process.exit(1); });
