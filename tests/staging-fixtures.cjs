// Local-only fixture seeding: fictional records encrypted with independent keys for each namespace.
/* eslint-disable @typescript-eslint/no-require-imports */
require("../scripts/auth.cjs");
const { randomBytes, randomUUID } = require("node:crypto");
const { seal } = require("../src/features/clinical/encryption.ts");
const { encrypt } = require("../src/features/auth/crypto.ts");
function fixtureSettings(url, ca, scope) {
  return { DATABASE_URL:url,DATABASE_CA_CERT:ca,AUTH_ORIGIN:"https://example.test",AUTH_SECRET:randomBytes(32).toString("hex"),
    SUPER_ADMIN_EMAIL:`${scope}@example.test`,ORGANISATION_NAME:"Fictional isolation test",SMTP_HOST:"localhost",SMTP_PORT:"587",SMTP_USER:"fictional",SMTP_PASSWORD:"fictional",SMTP_FROM:"practice@example.test",
    CLINICAL_ACTIVE_KEY:"test",CLINICAL_ENCRYPTION_KEYS:JSON.stringify({test:randomBytes(32).toString("hex")}),CLINICAL_TOKEN_KEY:randomBytes(32).toString("hex"),
    CLINICAL_SMTP_HOST:"localhost",CLINICAL_SMTP_PORT:"587",CLINICAL_SMTP_USER:"fictional",CLINICAL_SMTP_PASSWORD:"fictional",CLINICAL_SMTP_FROM:"practice@example.test",CLINICAL_STAFF_EMAIL:`${scope}@example.test`,
    CLINICAL_RETENTION_DAYS:"30",CLINICAL_INTEGRATIONS_APPROVED:"false",CLINICAL_REVIEW_MODE:"true",CLINICAL_REVIEW_EMAILS:`${scope}@example.test`,CLINICAL_SMS_ENABLED:"false" };
}
async function seedFixture(client, schema, settings) {
  Object.assign(process.env,settings);
  const org=randomUUID(),user=randomUUID(),physician=randomUUID(),appointment=randomUUID(),message=randomUUID();
  const profile={fullName:"[FICTIONAL PHYSICIAN]",title:"",email:"",phone:"",bio:"",credentials:"",specialties:"",languages:"",photo:"",slug:"fictional",active:true};
  const patient={name:"[FICTIONAL PATIENT]",email:settings.SUPER_ADMIN_EMAIL,phone:"+12025550101",dateOfBirth:"2000-01-01",reason:"Fictional test",privacyConsent:true,consentVersion:"2026-10-20",emailConsent:true,smsConsent:false};
  await client`insert into ${client(schema)}.organisations (id,name,key) values (${org},'Fictional test','emcrown')`;
  await client`insert into ${client(schema)}.users (id,email,password_hash,active) values (${user},${settings.SUPER_ADMIN_EMAIL},${`scrypt:${"1".repeat(32)}:${"2".repeat(128)}`},true)`;
  await client`insert into ${client(schema)}.memberships (organisation_id,user_id,role) values (${org},${user},'staff')`;
  await client`insert into ${client(schema)}.physicians (id,organisation_id,profile,publication,slug,active) values
    (${physician},${org},${seal(JSON.stringify(profile),org,physician,"physician")},${seal(JSON.stringify(profile),org,physician,"publication")},${`fixture-${physician}`},true)`;
  const starts=new Date(Date.now()+7*86400000),ends=new Date(starts.getTime()+1800000);
  await client`insert into ${client(schema)}.appointments (id,organisation_id,physician_id,location_id,type_id,start_at,end_at,occupied_until,patient,idempotency_key)
    values (${appointment},${org},${physician},'stuart','new-patient',${starts},${ends},${ends},${seal(JSON.stringify(patient),org,appointment,"patient")},${randomUUID()})`;
  const payload=seal(JSON.stringify({to:settings.SUPER_ADMIN_EMAIL,text:"FICTIONAL ISOLATION TEST"}),org,message,"message");
  await client`insert into ${client(schema)}.appointment_messages (id,organisation_id,appointment_id,appointment_version,channel,kind,payload,available_at)
    values (${message},${org},${appointment},1,'email','requested',${payload},now())`;
  await client`insert into ${client(schema)}.mail_outbox (user_id,payload,expires_at) values (${user},${encrypt("fictional-reset-token")},now()+interval '30 minutes')`;
}
module.exports={fixtureSettings,seedFixture};
