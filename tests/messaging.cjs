// Real SDK over local HTTP: fictional credentials and recipients; no live provider or database.
/* eslint-disable @typescript-eslint/no-require-imports */
require("../scripts/auth.cjs");
const assert = require("node:assert/strict");
const { PinpointSMSVoiceV2Client } = require("@aws-sdk/client-pinpoint-sms-voice-v2");
const { smsEnv, twilioSmsEnv } = require("../src/features/clinical/env.ts");
const { sendAwsSms } = require("../src/features/appointments/aws-sms.ts");
Object.assign(process.env, {
  CLINICAL_SMS_PROVIDER: "aws", CLINICAL_SMS_ENABLED: "true", CLINICAL_SMS_APPROVED: "true", AWS_REGION: "us-east-1",
  AWS_SMS_ORIGINATION_IDENTITY: "phone-test", AWS_SMS_CONFIGURATION_SET: "test-events",
  AWS_SMS_PROTECT_CONFIGURATION_ID: "protect-test", AWS_SMS_MAX_PRICE: "0.10",
});
(async () => {
  const env = smsEnv();
  assert.equal(env.provider, "aws");
  assert.throws(() => twilioSmsEnv());
  process.env.CLINICAL_SMS_APPROVED = "false"; assert.throws(() => smsEnv()); process.env.CLINICAL_SMS_APPROVED = "true";
  process.env.CLINICAL_SMS_ENABLED = "false"; assert.throws(() => smsEnv()); process.env.CLINICAL_SMS_ENABLED = "true";
  process.env.AWS_SMS_MAX_PRICE = "0.00"; assert.throws(() => smsEnv()); process.env.AWS_SMS_MAX_PRICE = "0.10";
  Object.assign(process.env, {
    CLINICAL_SMTP_HOST: "localhost", CLINICAL_SMTP_PORT: "587", CLINICAL_SMTP_USER: "fictional",
    CLINICAL_SMTP_PASSWORD: "fictional", CLINICAL_SMTP_FROM: "staff@example.test", CLINICAL_STAFF_EMAIL: "staff@example.test",
    CLINICAL_RETENTION_DAYS: "365", CLINICAL_INTEGRATIONS_APPROVED: "true", CLINICAL_SMS_ENABLED: "false",
  });
  const { deliverMessage } = require("../src/features/appointments/delivery.ts");
  await assert.rejects(deliverMessage("fictional", "sms", { to: "+12025550101", text: "test" }), { message: "SMS delivery is disabled." });
  process.env.CLINICAL_SMS_ENABLED = "true";
  const endpoint = "http://127.0.0.1:4910/aws-sms";
  const client = new PinpointSMSVoiceV2Client({ region: env.AWS_REGION, endpoint, maxAttempts: 1,
    credentials: { accessKeyId: "FICTIONALKEY", secretAccessKey: "fictional-secret-not-valid" },
    requestHandler: { connectionTimeout: 1000, requestTimeout: 2000 } });
  let signedRequests = 0;
  client.middlewareStack.add(next => async args => {
    assert.ok(args.request.headers.authorization?.startsWith("AWS4-HMAC-SHA256 "));
    signedRequests++;
    return next(args);
  }, { step: "finalizeRequest", name: "assertSigned", priority: "low" });
  const stats = async () => (await (await fetch(`${endpoint}/stats`)).json()).sends;
  try {
    const before = await stats();
    assert.equal(await sendAwsSms(env, "+12025550101", "Fictional delivery test", { client }), "00000000-0000-4000-8000-000000000001");
    assert.equal(await sendAwsSms(env, "+12025550101", "Fictional dry run", { client, dryRun: true }), null);
    for (const text of ["TEST_THROTTLE", "TEST_FAILURE", "TEST_HTML", "TEST_BAD_RESPONSE"]) {
      await assert.rejects(sendAwsSms(env, "+12025550101", text, { client }), { message: "SMS delivery unavailable." });
    }
    assert.equal(await stats() - before, 6, "SDK must not retry rejected or ambiguous sends");
    for (const [phone, text] of [["+2348000000000", "test"], ["+12025550101", "x".repeat(1601)], ["+12025550101", " "]]) {
      await assert.rejects(sendAwsSms(env, phone, text, { client }), { message: "SMS delivery unavailable." });
    }
    assert.equal(await stats() - before, 6, "Invalid payloads never reach provider");
    assert.equal(signedRequests, 6);
  } finally { client.destroy(); }
  const offline = new PinpointSMSVoiceV2Client({ region: "us-east-1", endpoint: "http://127.0.0.1:1", maxAttempts: 1,
    credentials: { accessKeyId: "FICTIONALKEY", secretAccessKey: "fictional-secret" }, requestHandler: { connectionTimeout: 100, requestTimeout: 100 } });
  try { await assert.rejects(sendAwsSms(env, "+12025550101", "test", { client: offline }), { message: "SMS delivery unavailable." }); }
  finally { offline.destroy(); }
  console.log("AWS SMS checks passed: signed HTTP requests, acceptance, dry run, validation, no retries, provider/network errors and configuration gates.");
})().catch(() => { console.error("Local messaging checks failed. Check the local simulation; no payload was logged."); process.exitCode = 1; });
