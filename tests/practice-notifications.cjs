// Pure persistence-boundary checks: fictional encrypted records and in-memory transactions only.
/* eslint-disable @typescript-eslint/no-require-imports */
require("../scripts/auth.cjs");
const assert = require("node:assert/strict");
const { randomBytes, randomUUID } = require("node:crypto");
Object.assign(process.env, { CLINICAL_ACTIVE_KEY: "test", CLINICAL_ENCRYPTION_KEYS: JSON.stringify({test:randomBytes(32).toString("hex")}), CLINICAL_TOKEN_KEY:randomBytes(32).toString("hex"), AUTH_ORIGIN:"http://localhost:3000", AUTH_SECRET:randomBytes(32).toString("hex"), DATABASE_URL:"postgres://unused:unused@localhost/unused", CLINICAL_STAFF_EMAIL:"staff@example.test" });
const { cmsDocuments } = require("../src/lib/db/schema.ts");
const { physicians, appointmentMessages } = require("../src/lib/db/clinical.ts");
const { seal, unseal } = require("../src/features/clinical/encryption.ts");
const { SITE_SEED } = require("../src/config/cms/content.ts");
const { findDefinition } = require("../src/config/cms/registry.ts");
const { physicianSchema, physicianWriteSchema } = require("../src/features/clinical/validation.ts");
const { publishedPractice } = require("../src/features/clinical/practice.ts");
const { physicianAlertRecipient } = require("../src/features/appointments/physician-alerts.ts");
const { queueAppointmentMessages } = require("../src/features/appointments/notifications.ts");
const { validateValues } = require("../src/features/cms/validation.ts");
const org = randomUUID(), physicianId = randomUUID();
const profile = {fullName:"Fictional Physician",title:"",email:"physician@example.test",phone:"",bio:"",credentials:"",specialties:"",languages:"",photo:"",slug:"fictional",active:true};
let enabled = false;
const values = {...findDefinition("/_site").initial, "practice.locations.0.address":"[TEST ADDRESS]", "practice.locations.0.label":"[TEST LOCATION]"};
const messages=[];
const tx = {
  select() { return { from(table) {
    const result = table === cmsDocuments ? [{published:values}] : table === physicians ? [{active:true, profile:seal(JSON.stringify({...profile,notifyAppointments:enabled}),org,physicianId,"physician")}] : [];
    const query={innerJoin(){return query;},where(){return query;},limit(){return Promise.resolve(result);},then(resolve,reject){return Promise.resolve(result).then(resolve,reject);}};
    return query;
  }}; },
  update(){return {set(){return {where:async()=>{}};}};}, delete(){return {where:async()=>{}};},
  insert(table){return {values:async value=>{if(table===appointmentMessages) messages.push(value);}};},
};
(async()=>{
  assert.equal(SITE_SEED.practice.locations.length,1);
  assert.equal(physicianSchema.parse(profile).notifyAppointments,false,"Older records default alerts off");
  assert.equal(physicianWriteSchema.safeParse({version:0,operation:"save",profile:{...profile,email:"",notifyAppointments:true}}).success,false);
  assert.equal(validateValues("/_site",{...values,"practice.locations.0.address":" "}),null);
  const practice=await publishedPractice(tx);
  assert.equal(practice.locations.length,1);assert.equal(practice.locations[0].address,"[TEST ADDRESS]");
  assert.equal(new URL(practice.locations[0].directions.href).searchParams.get("query"),"[TEST ADDRESS]");
  assert.equal(await physicianAlertRecipient(tx,org,physicianId),null);
  const row={id:randomUUID(),physicianId,organisationId:org,version:1,startAt:new Date(Date.now()+7*86400000),endAt:new Date(Date.now()+7*86400000+1800000),locationId:"stuart"};
  const patient={name:"Fictional patient",email:"patient@example.test",phone:"+12025550101",dateOfBirth:"2000-01-01",reason:"PRIVATE TEST REASON",smsConsent:false,emailConsent:true,privacyConsent:true,consentVersion:"2026-10-20"};
  await queueAppointmentMessages(tx,row,patient,"requested");
  assert.equal(messages.filter(item=>item.channel==="physician").length,0);
  enabled=true;messages.length=0;
  await queueAppointmentMessages(tx,row,patient,"requested");
  const alerts=messages.filter(item=>item.channel==="physician");assert.equal(alerts.length,1);
  for(const item of messages){
    const body=JSON.parse(unseal(item.payload,org,item.id,"message"));
    assert.ok(!item.payload.includes(patient.email));assert.ok(!body.text.includes(patient.reason));
    if(item.channel==="physician"){assert.equal(body.to,profile.email);assert.ok(!body.text.includes(patient.name));assert.ok(!body.text.includes("/book/manage#"));assert.ok(body.text.includes("/emcrown-admin/appointments"));assert.equal(body.calendar,undefined);}
    if(item.channel==="email")assert.ok(body.text.includes("[TEST ADDRESS]"));
  }
  assert.equal(messages.filter(item=>item.channel==="email"&&item.kind.startsWith("reminder")).length,2);
  enabled=false;assert.equal(await physicianAlertRecipient(tx,org,physicianId),null,"Disabled preference is rechecked for queued alerts");
  console.log("Practice/notification checks passed: one published address, derived directions, alert defaults/validation, opt-in encrypted minimal alerts and patient reminders.");
})().catch(error=>{console.error(error);process.exitCode=1;});
