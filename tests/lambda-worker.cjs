// Lambda unit/packaging checks: fictional settings, in-memory database/SMTP boundaries; no AWS calls or messages.
/* eslint-disable @typescript-eslint/no-require-imports */
require("../scripts/auth.cjs");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { randomBytes } = require("node:crypto");
const { createHandler } = require("../infrastructure/lambda/bootstrap.cjs");
const { configureWorker, runWorker } = require("../src/features/messaging/handler.ts");
const settings = {
  DATABASE_URL:"postgres://fictional:fictional@localhost/unused", AUTH_ORIGIN:"https://example.test", AUTH_SECRET:randomBytes(32).toString("hex"),
  SUPER_ADMIN_EMAIL:"staff@example.test", ORGANISATION_NAME:"Fictional practice", SMTP_HOST:"localhost", SMTP_PORT:"587", SMTP_USER:"fictional", SMTP_PASSWORD:"fictional", SMTP_FROM:"staff@example.test",
  CLINICAL_ACTIVE_KEY:"test", CLINICAL_ENCRYPTION_KEYS:JSON.stringify({test:randomBytes(32).toString("hex")}), CLINICAL_TOKEN_KEY:randomBytes(32).toString("hex"),
  CLINICAL_SMTP_HOST:"localhost", CLINICAL_SMTP_PORT:"587", CLINICAL_SMTP_USER:"fictional", CLINICAL_SMTP_PASSWORD:"fictional", CLINICAL_SMTP_FROM:"practice@example.test", CLINICAL_STAFF_EMAIL:"staff@example.test",
  CLINICAL_RETENTION_DAYS:"30", CLINICAL_INTEGRATIONS_APPROVED:"true", CLINICAL_REVIEW_MODE:"false", CLINICAL_SMS_ENABLED:"false",
};
const event={operation:"deliver-email"}, context={getRemainingTimeInMillis:()=>300000};
async function orchestration(run) {
  const calls=[];
  const services={assertWorkerRuntime:async()=>calls.push("ready"),closeDatabase:async()=>calls.push("close"),
    deliverResetEmails:async(limit,canStart)=>{assert.equal(limit,5);assert.ok(canStart());calls.push("accounts");return 2;},
    deliverAppointments:async(limit,canStart)=>{assert.equal(limit,5);assert.ok(canStart());calls.push("appointments");return 3;}};
  assert.deepEqual(await run(event,context,services),{accounts:2,appointments:3});
  assert.deepEqual(calls,["ready","accounts","appointments","close"]);
  calls.length=0;
  assert.deepEqual(await run({operation:"check-configuration"},context,services),{ready:true});
  assert.deepEqual(calls,["ready","close"]);
  calls.length=0;
  assert.deepEqual(await run(event,{getRemainingTimeInMillis:()=>90000},services),{accounts:0,appointments:0});
  assert.deepEqual(calls,["ready","close"]);
  calls.length=0;
  await assert.rejects(run(event,context,{...services,deliverResetEmails:async()=>{throw new Error("private");}}),/incomplete/);
  assert.deepEqual(calls,["ready","appointments","close"],"One queue failure must not starve the other");
  calls.length=0;
  await assert.rejects(run(event,context,{...services,assertWorkerRuntime:async()=>{throw new Error("private");}}));
  assert.deepEqual(calls,["close"],"Runtime denial prevents sends and still closes connections");
  await assert.rejects(run({...event,patient:"must not accept patient input"},context,services),/Invalid/);
}
(async()=>{
  process.env.NODE_ENV="production";
  configureWorker(settings);
  assert.throws(()=>configureWorker({...settings,DATABASE_MIGRATION_URL:"must-reject"}),/invalid/);
  assert.throws(()=>configureWorker({...settings,AWS_ACCESS_KEY_ID:"must-reject"}),/invalid/);
  assert.throws(()=>configureWorker({...settings,CLINICAL_SMS_ENABLED:"true"}),/incomplete/);
  assert.throws(()=>configureWorker({...settings,CLINICAL_INTEGRATIONS_APPROVED:"false"}),/incomplete/);
  configureWorker(settings);
  await orchestration(runWorker);
  const logs=[]; const oldLog=console.log; const oldError=console.error;
  console.log=(...args)=>logs.push(JSON.stringify(args));console.error=console.log;
  try {
    process.env.WORKER_DELIVERY_ENABLED="false";
    process.env.WORKER_SETTINGS_JSON=JSON.stringify(settings);
    let runs=0;const configurations=[];
    const handler=createHandler({loadWorker:()=>({configureWorker:input=>{configurations.push(input);configureWorker(input);},runWorker:async()=>{runs++;return {ready:true};}})});
    assert.deepEqual(await handler(event,context),{disabled:true});assert.equal(configurations.length,0);
    await handler({operation:"check-configuration"},context);assert.equal(runs,1);
    process.env.WORKER_DELIVERY_ENABLED="true";await handler(event,context);assert.equal(runs,2);
    process.env.WORKER_SETTINGS_JSON=JSON.stringify({...settings,ORGANISATION_NAME:"Updated fictional practice"});
    await handler(event,context);assert.equal(configurations.at(-1).ORGANISATION_NAME,"Updated fictional practice","Configuration updates must not use a stale cache");
    await assert.rejects(handler({...event,email:"private"},context),/Email worker failed/);
    process.env.WORKER_SETTINGS_JSON="invalid JSON SENSITIVE_PROVIDER_TEXT";
    await assert.rejects(handler(event,context),/Email worker failed/);
    const count=configurations.length;
    process.env.WORKER_SETTINGS_JSON=JSON.stringify({...settings,ORGANISATION_NAME:"x".repeat(4096)});
    await assert.rejects(handler(event,context),/Email worker failed/);assert.equal(configurations.length,count,"Oversize environment must fail before worker loading");
    process.env.WORKER_SETTINGS_JSON=JSON.stringify(settings);
    await assert.rejects(createHandler({loadWorker:()=>{throw new Error("SENSITIVE_PROVIDER_TEXT");}})(event,context),/Email worker failed/);
    assert.ok(!logs.join("").includes("SENSITIVE_PROVIDER_TEXT"));assert.ok(!logs.join("").includes(settings.AUTH_SECRET));
  } finally {console.log=oldLog;console.error=oldError;}
  configureWorker(settings);
  const database=require("../src/lib/db/index.ts");const originalDb=database.db;
  let checks=0;let privilege=true;let owner=false;
  database.db=()=>({execute:async()=>++checks===1 ? [{name:"emcrown_runtime",superuser:false,create_role:false,create_database:false,bypass_rls:false,database_owner:owner}] : [{allowed:privilege}]});
  try {
    const {assertWorkerRuntime}=require("../src/features/messaging/runtime.ts");
    await assertWorkerRuntime();assert.equal(checks,2);
    checks=0;privilege=false;await assert.rejects(assertWorkerRuntime(),/permissions/);
    checks=0;owner=true;await assert.rejects(assertWorkerRuntime(),/least-privilege/);assert.equal(checks,1);
  } finally {database.db=originalDb;}
  let claims=0;
  database.db=()=>({update:()=>({set:()=>({where:async()=>{}})}),transaction:async fn=>{claims++;return fn({delete:()=>({where:async()=>{}})});}});
  try {
    assert.equal(await require("../src/features/appointments/worker.ts").deliverAppointments(5,()=>false),0);
    assert.equal(claims,0,"No new appointment claim once deadline reserve is reached");
    assert.equal(await require("../src/features/auth/mail.ts").deliverResetEmails(5,()=>false),0);
    assert.equal(claims,1,"Account worker performs cleanup only, no message claim");
  } finally {database.db=originalDb;}
  const template=JSON.parse(fs.readFileSync("infrastructure/lambda/template.json"));
  assert.equal(template.Parameters.DeliveryEnabled.Default,"false");assert.equal(template.Parameters.ScheduleState.Default,"DISABLED");
  assert.equal(template.Resources.Worker.Properties.ReservedConcurrentExecutions,1);
  assert.equal(template.Resources.NoAsyncRetries.Properties.MaximumRetryAttempts,0);
  assert.equal(template.Resources.Schedule.Properties.Target.RetryPolicy.MaximumRetryAttempts,0);
  assert.equal(template.Resources.Worker.Properties.Runtime,"nodejs22.x");
  assert.equal(template.Parameters.WorkerSettingsJson.NoEcho,true,"CloudFormation must mask settings values");
  assert.equal(template.Parameters.WorkerSettingsJson.Default,"{}");
  assert.equal(template.Parameters.DatabaseScope.Default,"staging");
  assert.ok(!/secretsmanager:|kms:Decrypt|ConfigurationSecretArn|WORKER_CONFIG_SECRET_ARN/.test(JSON.stringify(template)),"No paid secret-store dependency or IAM permissions");
  assert.ok(!/client-secrets-manager|GetSecretValue/.test(fs.readFileSync("infrastructure/lambda/bootstrap.cjs","utf8")));
  assert.ok(!Object.values(template.Resources).some(resource=>resource.Type==="AWS::Lambda::Url"),"Worker must not expose public invocation URL");
  const bundled=require("../artifacts/lambda/worker.cjs");
  bundled.configureWorker(settings);await orchestration(bundled.runWorker);
  const zip=await require("jszip").loadAsync(fs.readFileSync("artifacts/lambda/email-worker.zip"));
  assert.ok(zip.files["bootstrap.cjs"]);assert.ok(zip.files["worker.cjs"]);
  assert.equal(await zip.file("bootstrap.cjs").async("string"),fs.readFileSync("infrastructure/lambda/bootstrap.cjs","utf8"),"Archive must contain the current environment-only bootstrap");
  assert.equal(await zip.file("worker.cjs").async("string"),fs.readFileSync("artifacts/lambda/worker.cjs","utf8"),"Smoke tests must exercise the actual archived worker");
  assert.ok(!Object.keys(zip.files).some(name=>/\.env|settings.*json/.test(name)),"Archive must contain no configuration secrets");
  assert.ok(!JSON.parse(fs.readFileSync("artifacts/lambda/bundle-inputs.json")).some(name=>/node_modules\/next\//.test(name)));
  console.log("Lambda checks passed: disabled defaults, strict settings/events, readiness isolation, deadlines, both queues, failure isolation, sanitized errors, encrypted-environment configuration/quota and bundled-worker smoke.");
})().catch(()=>{console.error("Lambda checks failed; fictional test configuration only.");process.exitCode=1;});
