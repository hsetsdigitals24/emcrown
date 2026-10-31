// Protocol boundary checks: mock external services; never transmit CVs, credentials or patient data.
/* eslint-disable @typescript-eslint/no-require-imports -- Reuse the installed TypeScript loader. */
require("../scripts/auth.cjs");
const assert=require("node:assert/strict");const {randomBytes,randomUUID,createHmac}=require("node:crypto");
Object.assign(process.env,{DATABASE_URL:"postgresql://test@localhost/test",AUTH_ORIGIN:"https://example.test",AUTH_SECRET:"a".repeat(64),SUPER_ADMIN_EMAIL:"owner@example.test",ORGANISATION_NAME:"Test",SMTP_HOST:"localhost",SMTP_PORT:"587",SMTP_USER:"test",SMTP_PASSWORD:"test",SMTP_FROM:"staff@example.test",
 CLINICAL_ACTIVE_KEY:"test",CLINICAL_ENCRYPTION_KEYS:JSON.stringify({test:randomBytes(32).toString("hex")}),CLINICAL_TOKEN_KEY:randomBytes(32).toString("hex"),
 CLINICAL_REVIEW_MODE:"false",CLINICAL_BOOKING_ENABLED:"true",CLINICAL_INTEGRATIONS_APPROVED:"true",CLINICAL_RETENTION_DAYS:"365",CLINICAL_SMTP_HOST:"localhost",CLINICAL_SMTP_PORT:"587",CLINICAL_SMTP_USER:"test",CLINICAL_SMTP_PASSWORD:"test",CLINICAL_SMTP_FROM:"staff@example.test",CLINICAL_STAFF_EMAIL:"staff@example.test",TURNSTILE_SITE_KEY:"fake-site-key-for-tests",TURNSTILE_SECRET_KEY:"fake-secret-key-for-tests",CLINICAL_SMS_ENABLED:"false",
 SUPABASE_URL:"https://storage.example.test",SUPABASE_SERVICE_ROLE_KEY:"fake-server-key-for-tests-only",SUPABASE_STORAGE_BUCKET:"cms-images",SUPABASE_CV_BUCKET:"physician-cvs",
 CLINICAL_SMS_PROVIDER:"twilio",TWILIO_ACCOUNT_SID:"AC"+"a".repeat(32),TWILIO_AUTH_TOKEN:"fake-provider-token-for-tests-only",TWILIO_MESSAGING_SERVICE_SID:"MG"+"a".repeat(32),CLINICAL_SMS_APPROVED:"true"});
(async()=>{
 const {liveBookingConfigured}=require("../src/features/clinical/env.ts");assert.equal(liveBookingConfigured(),true);
 process.env.CLINICAL_INTEGRATIONS_APPROVED="false";assert.equal(liveBookingConfigured(),false);process.env.CLINICAL_INTEGRATIONS_APPROVED="true";
 const {verifyBookingCaptcha}=require("../src/features/appointments/captcha.ts");
 let challengeBody;
 global.fetch=async(url,options)=>{assert.equal(url,"https://challenges.cloudflare.com/turnstile/v0/siteverify");challengeBody=options.body;return Response.json({success:true,hostname:"example.test",action:"booking"});};
 assert.equal(await verifyBookingCaptcha("opaque-test-token"),true);assert.deepEqual([...challengeBody.keys()].sort(),["response","secret"]);
 global.fetch=async()=>Response.json({success:true,hostname:"other.test",action:"booking"});assert.equal(await verifyBookingCaptcha("opaque-test-token"),false);
 global.fetch=async()=>Response.json({success:true,hostname:"example.test",action:"other"});assert.equal(await verifyBookingCaptcha("opaque-test-token"),false);
 global.fetch=async()=>Response.json({success:false,"error-codes":["timeout-or-duplicate"]});assert.equal(await verifyBookingCaptcha("opaque-test-token"),false);
 const {cvObject}=require("../src/features/physicians/cv-storage.ts");const object=`${randomUUID()}/${randomUUID()}.enc`;const requests=[];
 global.fetch=async(url,options)=>{requests.push({url,...options});return url.includes("/bucket/")?Response.json({public:false}):new Response("encrypted-fixture");};
 await cvObject(object,"POST",Buffer.from("encrypted-fixture"));assert.equal(requests[1].headers["Content-Type"],"application/octet-stream");assert.equal(requests[1].redirect,"error");
 assert.equal(await(await cvObject(object,"GET")).text(),"encrypted-fixture");assert.ok(requests.at(-1).url.includes("/object/authenticated/physician-cvs/"));
 await assert.rejects(cvObject("../private","GET"));global.fetch=async()=>Response.json({public:true});await assert.rejects(cvObject(object,"POST",Buffer.alloc(1)),/Private CV bucket/);
 require("../src/features/auth/rate-limit.ts").allowAttempt=async()=>true;
 const {signedSmsForm}=require("../src/features/appointments/sms.ts");const form=new URLSearchParams({AccountSid:process.env.TWILIO_ACCOUNT_SID,From:"+12025550110",Body:"STOP",MessageSid:"SM"+"b".repeat(32),FutureParameter:"accepted"});
 const url="https://example.test/api/booking/sms";const canonical=url+[...form.keys()].sort().map(key=>key+form.get(key)).join("");
 const signature=createHmac("sha1",process.env.TWILIO_AUTH_TOKEN).update(canonical).digest("base64");
 const request=value=>new Request(url,{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded","x-twilio-signature":value},body:form});
 assert.ok(await signedSmsForm(request(signature),"/api/booking/sms"));assert.equal(await signedSmsForm(request("invalid"),"/api/booking/sms"),null);
 const job=require("../src/app/api/internal/appointments/route.ts");process.env.CRON_SECRET="test-scheduler-secret-at-least-thirty-two-chars";
 assert.equal((await job.GET(new Request("https://example.test/api/internal/appointments"))).status,401);
 const {clinicalKeys}=require("../src/features/clinical/encryption.ts");process.env.CLINICAL_ACTIVE_KEY="toString";assert.throws(clinicalKeys,/active encryption key/);
 console.log("Clinical boundary checks passed: launch approval gates, CAPTCHA hostname/action/expiry, minimal verification payload, private CV transport and provider webhook signatures.");
})().catch(error=>{console.error(error);process.exitCode=1;});
