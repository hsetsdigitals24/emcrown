// Node transport regression: private Storage requests, configuration and legacy media bytes.
/* eslint-disable @typescript-eslint/no-require-imports -- Existing TypeScript test loader. */
require("../scripts/auth.cjs");
const assert = require("node:assert/strict");
const { storeImage, loadImage, deleteImage, storageEnv } = require("../src/lib/storage.ts");
const { mediaBytes } = require("../src/features/cms/media.ts");
(async () => {
  Object.assign(process.env, { SUPABASE_URL: "https://storage.example.test", SUPABASE_STORAGE_BUCKET: "cms-images", SUPABASE_SERVICE_ROLE_KEY: "test-server-key-with-no-real-access" });
  const calls = [];
  global.fetch = async (url, options) => {
    if (url.includes("/bucket/")) return Response.json({ public: false });
    calls.push({ url, ...options }); return new Response(new Uint8Array([1, 2, 3]));
  };
  const path = "11111111-1111-4111-8111-111111111111/22222222-2222-4222-8222-222222222222.webp";
  await storeImage(path, Buffer.from([1, 2, 3]));
  assert.equal(calls[0].method, "POST"); assert.equal(calls[0].headers["x-upsert"], "false");
  assert.equal(calls[0].headers.Authorization, `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`);
  assert.equal(calls[0].cache, "no-store"); assert.equal(calls[0].redirect, "error");
  assert.deepEqual(await loadImage(path), Buffer.from([1, 2, 3]));
  assert.ok(calls[1].url.includes("/object/authenticated/cms-images/"));
  await deleteImage(path); assert.equal(calls[2].method, "DELETE");
  await assert.rejects(storeImage("../secret", Buffer.alloc(1)), /Invalid storage path/);
  assert.equal(calls.length, 3);
  assert.deepEqual(await mediaBytes({ storagePath: null, data: Buffer.from("legacy").toString("base64") }), Buffer.from("legacy"));
  global.fetch = async () => new Response(null, { status: 403 });
  await assert.rejects(loadImage(path), /storage request failed/);
  global.fetch = async () => Response.json({ public: true });
  await assert.rejects(storeImage(path, Buffer.alloc(1)), /private bucket/);
  process.env.SUPABASE_URL = "http://untrusted.example";
  assert.throws(storageEnv, /Configure/);
  console.log("CMS Storage passed: private authenticated transport, no overwrite/redirect/cache, path/config validation, failure handling and legacy compatibility.");
})().catch(error => { console.error(error); process.exitCode = 1; });
