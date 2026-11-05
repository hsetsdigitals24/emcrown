// Fresh-process namespace test: actual local PostgreSQL and actual worker, with SMTP replaced in memory.
/* eslint-disable @typescript-eslint/no-require-imports */
require("../scripts/auth.cjs");
const assert=require("node:assert/strict");
const settings=JSON.parse(process.env.ISOLATION_SETTINGS);
Object.assign(process.env,settings,{NODE_ENV:"production"});
const { DATABASE_SCHEMA,DATABASE_RUNTIME_ROLE }=require("../src/config/database.ts");
const nodemailer=require("nodemailer");const sent=[];
nodemailer.createTransport=()=>({sendMail:async options=>{sent.push(options);return {accepted:[options.to],rejected:[]};}});
const {configureWorker,runWorker}=require("../src/features/messaging/handler.ts");
const {db,closeDatabase}=require("../src/lib/db/index.ts");
const {sql}=require("drizzle-orm");
async function run() {
  configureWorker(settings);
  assert.deepEqual(await runWorker({operation:"check-configuration"},{getRemainingTimeInMillis:()=>300000}),{ready:true});
  const bundled=require("../artifacts/lambda/worker.cjs");bundled.configureWorker(settings);
  assert.deepEqual(await bundled.runWorker({operation:"check-configuration"},{getRemainingTimeInMillis:()=>300000}),{ready:true},"Actual Lambda bundle must select the same namespace and role");
  if (DATABASE_SCHEMA === "emcrown_staging") {
    process.env.CLINICAL_REVIEW_MODE="false";assert.throws(()=>db(),/review/);process.env.CLINICAL_REVIEW_MODE="true";
    process.env.DATABASE_URL=settings.DATABASE_URL.replace("emcrown_staging_runtime","emcrown_runtime");
    assert.throws(()=>db(),/restricted/);process.env.DATABASE_URL=settings.DATABASE_URL;
  }
  const other=DATABASE_SCHEMA==="emcrown_staging"?"emcrown_admin":"emcrown_staging";
  for(const operation of [sql`select * from ${sql.identifier(other)}.users`,sql`update ${sql.identifier(other)}.appointment_messages set attempts=attempts where false`,
    sql`select ${sql.identifier(other)}.accept_invitation('fictional')`,sql`set role ${sql.identifier(other==="emcrown_admin"?"emcrown_runtime":"emcrown_staging_runtime")}`]) {
    await assert.rejects(db().execute(operation),error=>error.cause?.code==="42501"||error.code==="42501");
  }
  const {allowAttempt}=require("../src/features/auth/rate-limit.ts");
  assert.equal(await allowAttempt("namespace-fixture","fictional",5),true);
  const result=await runWorker({operation:"deliver-email"},{getRemainingTimeInMillis:()=>300000});
  assert.deepEqual(result,{accounts:1,appointments:1});assert.equal(sent.length,2);
  for(const email of sent){assert.equal(email.to,settings.SUPER_ADMIN_EMAIL);assert.ok(email.html);}
  console.log(JSON.stringify({schema:DATABASE_SCHEMA,role:DATABASE_RUNTIME_ROLE,accountJobs:result.accounts,appointmentJobs:result.appointments,crossSchemaDenied:true}));
}
run().catch(()=>{console.error("Namespace worker test failed; local fictional fixtures only.");process.exitCode=1;}).finally(closeDatabase);
