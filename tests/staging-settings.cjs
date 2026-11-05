// Pure staging configuration checks using fictional credentials; never connects or sends mail.
/* eslint-disable @typescript-eslint/no-require-imports */
const assert=require("node:assert/strict"),fs=require("node:fs");
const {stagingConnection,buildSettings,serializeSettings,replacePassword}=require("../scripts/staging-settings.cjs");
const source={DATABASE_URL:"postgres://emcrown_runtime.fictional:old@pooler.example.test:6543/postgres",
  AUTH_ORIGIN:"https://live.example.test",DATABASE_MIGRATION_URL:"never-copy",SUPABASE_SERVICE_ROLE_KEY:"never-copy",
  AUTH_SECRET:"never-copy",SMTP_PASSWORD:"fake$PASSWORD#'value",CLINICAL_TOKEN_KEY:"never-copy"};
const template=fs.readFileSync(".env.example","utf8");
const before=JSON.stringify(source);
const settings=buildSettings(source,template,"fictional:p@ss/$word","http://localhost:3109","review@example.test");
const url=new URL(settings.DATABASE_URL);
assert.equal(decodeURIComponent(url.username),"emcrown_staging_runtime.fictional");
assert.equal(decodeURIComponent(url.password),"fictional:p@ss/$word");
assert.equal(url.host,"pooler.example.test:6543");
assert.equal(new URL(stagingConnection("postgres://emcrown_runtime:old@db.example.test/postgres","new")).username,"emcrown_staging_runtime");
assert.throws(()=>stagingConnection("postgres://postgres:owner@db.example.test/postgres","new"));
assert.equal(settings.DATABASE_MIGRATION_URL,"");assert.equal(settings.SUPABASE_SERVICE_ROLE_KEY,"");
assert.equal(settings.CRON_SECRET,"");assert.equal(settings.WORKER_DELIVERY_ENABLED,"false");
assert.equal(settings.CLINICAL_BOOKING_ENABLED,"false");assert.equal(settings.CLINICAL_SMS_ENABLED,"false");
assert.equal(settings.EMCROWN_DATABASE_SCOPE,"staging");assert.equal(settings.CLINICAL_REVIEW_MODE,"true");
assert.equal(settings.SUPER_ADMIN_EMAIL,"review@example.test");assert.equal(settings.CLINICAL_STAFF_EMAIL,"review@example.test");
assert.match(settings.AUTH_SECRET,/^[a-f0-9]{64}$/);assert.match(settings.CLINICAL_TOKEN_KEY,/^[a-f0-9]{64}$/);
const key=JSON.parse(settings.CLINICAL_ENCRYPTION_KEYS)["staging-v1"];
assert.equal(new Set([key,settings.AUTH_SECRET,settings.CLINICAL_TOKEN_KEY]).size,3);
assert.equal(JSON.stringify(source),before);
const changed=replacePassword(settings,"replacement:p@$word");
assert.equal(decodeURIComponent(new URL(changed.DATABASE_URL).password),"replacement:p@$word");
assert.deepEqual({...changed,DATABASE_URL:settings.DATABASE_URL},settings);
assert.throws(()=>replacePassword({...settings,EMCROWN_DATABASE_SCOPE:"live"},"replacement"));
for(const origin of [source.AUTH_ORIGIN,"http://external.example.test","https://stage.example.test/path","https://user:pass@stage.example.test"])
  assert.throws(()=>buildSettings(source,template,"pw",origin,"review@example.test"));
assert.throws(()=>buildSettings(source,template,"pw","http://localhost:3109","invalid"));
// Use the installed Next parser/expander to prove special characters survive dotenv loading.
const {processEnv}=require("@next/env");
const values={STAGE_TEST_PASS:"fake$PASSWORD#'value",STAGE_TEST_JSON:settings.CLINICAL_ENCRYPTION_KEYS,
  STAGE_TEST_CA:"-----BEGIN CERTIFICATE-----\nfictional\n-----END CERTIFICATE-----",STAGE_TEST_SLASH:"back\\slash$literal"};
const [,parsed]=processEnv([{path:".env.staging",contents:serializeSettings(values),env:{}}],process.cwd(),console,true);
for(const [name,value] of Object.entries(values)) assert.equal(parsed[name],value);
console.log("Staging settings checks passed: restricted role, independent keys, disabled delivery, no owner secrets and exact dotenv round-trip.");
