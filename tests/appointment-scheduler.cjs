// Scheduler HTTP boundary tests: fake worker/runtime only; no database, delivery or network calls.
/* eslint-disable @typescript-eslint/no-require-imports -- Existing repository TypeScript loader. */
require("../scripts/auth.cjs");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const runtime = require("../src/features/clinical/runtime.ts");
const worker = require("../src/features/appointments/worker.ts");
const throttle = require("../src/features/auth/rate-limit.ts");
let runtimeCalls = 0; let workerCalls = 0; let allowed = true; let runtimeError = false; let workerError = false;
runtime.assertClinicalRuntime = async () => { runtimeCalls++; if (runtimeError) throw new Error("private diagnostic"); };
throttle.allowAttempt = async (scope, identity, limit) => {
  assert.equal(scope, "clinical:worker"); assert.equal(identity, "scheduler"); assert.equal(limit, 120); return allowed;
};
worker.deliverAppointments = async limit => { workerCalls++; assert.equal(limit, 5); if (workerError) throw new Error("private diagnostic"); return 3; };
global.fetch = async () => { throw new Error("Unexpected network call"); };
const { GET, POST } = require("../src/app/api/internal/appointments/route.ts");
const secret = "fictional-scheduler-secret-at-least-32-characters";
function request(method, token, query = "") {
  return new Request(`https://example.test/api/internal/appointments${query}`, { method, headers: token ? { Authorization: `Bearer ${token}` } : {} });
}
(async () => {
  assert.equal(JSON.parse(fs.readFileSync("vercel.json", "utf8")).crons, undefined);
  for (const [method, handle] of [["GET", GET], ["POST", POST]]) {
    runtimeCalls = 0; workerCalls = 0;
    delete process.env.CRON_SECRET;
    assert.equal((await handle(request(method, secret))).status, 401);
    process.env.CRON_SECRET = "short";
    assert.equal((await handle(request(method, "short"))).status, 401);
    process.env.CRON_SECRET = secret;
    assert.equal((await handle(request(method))).status, 401);
    assert.equal((await handle(request(method, "wrong"))).status, 401);
    assert.equal((await handle(request(method, undefined, `?secret=${secret}`))).status, 401);
    assert.equal(runtimeCalls, 0); assert.equal(workerCalls, 0);
    const response = await handle(request(method, secret));
    assert.equal(response.status, 200); assert.deepEqual(await response.json(), { ok: true, processed: 3 });
    assert.match(response.headers.get("cache-control"), /no-store/);
    assert.equal(runtimeCalls, 1); assert.equal(workerCalls, 1);
    allowed = false;
    assert.equal((await handle(request(method, secret))).status, 429); assert.equal(workerCalls, 1);
    allowed = true; runtimeError = true;
    const unavailable = await handle(request(method, secret));
    assert.equal(unavailable.status, 503); assert.deepEqual(await unavailable.json(), { ok: false });
    assert.equal(workerCalls, 1);
    runtimeError = false; workerError = true;
    const failed = await handle(request(method, secret));
    assert.equal(failed.status, 503); assert.deepEqual(await failed.json(), { ok: false });
    workerError = false;
  }
  console.log("Passed: no registered Vercel cron; disabled/short/missing/wrong/query secrets rejected; GET/POST auth, bounded dispatch, no-store, throttling and generic failures.");
})().catch(error => { console.error(error); process.exitCode = 1; });
