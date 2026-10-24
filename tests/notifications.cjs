// Isolated PostgreSQL + real signature/HTTP tests; fictional SES events only, never real email.
/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('node:fs');
if (!process.env.NOTIFICATION_TEST_DATABASE_URL || !process.env.NOTIFICATION_TEST_CA_FILE) throw new Error('Provide isolated local test database and CA file.');
process.env.AUTH_TEST_DATABASE_URL = process.env.NOTIFICATION_TEST_DATABASE_URL;
process.env.DATABASE_CA_CERT = fs.readFileSync(process.env.NOTIFICATION_TEST_CA_FILE, 'utf8');
const {assert,testUrl,db,migrate,eq,tables,seedOrganisation,createSession,setSessionCookie} = require('./auth-setup.cjs');
const postgres = require('postgres');
const {randomUUID,randomBytes,sign} = require('node:crypto');
const {and} = require('drizzle-orm');
const clinical = require('../src/lib/db/clinical.ts');
const topic='arn:aws:sns:eu-north-1:111111111111:fictional-delivery';
Object.assign(process.env, {CLINICAL_ACTIVE_KEY:'test',CLINICAL_ENCRYPTION_KEYS:JSON.stringify({test:randomBytes(32).toString('hex')}),CLINICAL_TOKEN_KEY:randomBytes(32).toString('hex'),CLINICAL_EMAIL_EVENTS_ENABLED:'false',AWS_SES_EVENT_TOPIC_ARN:topic,CLINICAL_SMTP_FROM:'sender@example.test'});
const realFetch=global.fetch;
const outgoing=[];
// Repoint only the SNS dependency host to Postman's local HTTP stand-in; run real fetch otherwise.
global.fetch=(url,options)=>{
 const target=new URL(String(url));
 if(target.hostname==='sns.eu-north-1.amazonaws.com'){
  outgoing.push({path:target.pathname,action:target.searchParams.get('Action')});
  return realFetch('http://127.0.0.1:4930/sns'+target.pathname+target.search,options);
 }
 return realFetch(url,options);
};
const {seal}=require('../src/features/clinical/encryption.ts');
const {writePhysician}=require('../src/features/physicians/repository.ts');
const {listAppointments}=require('../src/features/appointments/repository.ts');
const {listNotificationFeed}=require('../src/features/notifications/repository.ts');
const {recordDelivery}=require('../src/features/notifications/record-delivery.ts');
const {emailOutcome}=require('../src/features/notifications/email-event.ts');
const {snsCanonical,verifySns,confirmSns}=require('../src/features/notifications/sns.ts');
const {notificationStateLabel}=require('../src/features/notifications/status.ts');
const {POST}=require('../src/app/api/booking/email/status/route.ts');
const {GET}=require('../src/app/emcrown-admin/notifications/api/route.ts');
const key=fs.readFileSync('/tmp/emcrown-notifications-sns.key');
let database;
function signed(message,type='Notification'){
 const envelope={Type:type,MessageId:randomUUID(),TopicArn:topic,Message:JSON.stringify(message),Timestamp:new Date().toISOString(),SignatureVersion:'2',SigningCertURL:'https://sns.eu-north-1.amazonaws.com/SimpleNotificationService-test.pem',Signature:'AA=='};
 if(type==='SubscriptionConfirmation') Object.assign(envelope,{Token:'fictional-confirmation-token',SubscribeURL:'https://untrusted.example.test/ignored'});
 envelope.Signature=sign('RSA-SHA256',Buffer.from(snsCanonical(envelope)),key).toString('base64');return envelope;
}
function request(body){return new Request('http://localhost:3000/api/booking/email/status',{method:'POST',body:JSON.stringify(body)});}
async function main(){
 const admin=postgres(testUrl,{ssl:{rejectUnauthorized:true,ca:process.env.DATABASE_CA_CERT},max:1,onnotice(){}});
 const name='emcrown_auth_test_notifications_'+Date.now();await admin`create database ${admin(name)}`;await admin.end();
 const url=new URL(testUrl);url.pathname='/'+name;process.env.DATABASE_URL=url.toString();
 database=db();await migrate(database,{migrationsFolder:'drizzle'});await seedOrganisation();
 const [owner]=await database.select().from(tables.users);const [membership]=await database.select().from(tables.memberships);const org=membership.organisationId;
 await database.update(tables.users).set({mustChangePassword:false,mfaSecret:require('../src/features/auth/crypto.ts').encrypt(require('otplib').generateSecret())}).where(eq(tables.users.id,owner.id));
 const token=await database.transaction(tx=>createSession(tx,owner.id,org,'full'));await setSessionCookie(token);
 const physicianId=randomUUID(),appointmentId=randomUUID(),messageId=randomUUID();
 const profile={fullName:'Fictional physician',title:'',email:'physician@example.test',phone:'',bio:'',credentials:'',specialties:'',languages:'',photo:'',slug:'fictional',active:true,notifyAppointments:false};
 await database.insert(clinical.physicians).values({id:physicianId,organisationId:org,slugHash:'fictional',profile:seal(JSON.stringify(profile),org,physicianId,'physician')});
 const start=new Date(Date.now()+86400000),end=new Date(start.getTime()+1800000);
 const patient={name:'PRIVATE FICTIONAL NAME',email:'patient@example.test',phone:'+12025550101',dateOfBirth:'2000-01-01',reason:'PRIVATE FICTIONAL REASON',emailConsent:true,smsConsent:false,privacyConsent:true,consentVersion:'2026-10-20'};
 await database.insert(clinical.appointments).values({id:appointmentId,organisationId:org,physicianId,locationId:'stuart',typeId:'new-patient',startAt:start,endAt:end,occupiedUntil:end,patient:seal(JSON.stringify(patient),org,appointmentId,'patient'),idempotencyKey:randomUUID()});
 await database.insert(clinical.appointmentMessages).values({id:messageId,organisationId:org,appointmentId,appointmentVersion:1,channel:'email',kind:'confirmed',state:'sent',availableAt:new Date(),attempts:1,payload:seal(JSON.stringify({to:patient.email,text:'Fictional test only'}),org,messageId,'message')});
 await database.insert(clinical.appointmentEvents).values({organisationId:org,appointmentId,action:'appointments.requested'});
 const other=randomUUID();await database.insert(tables.organisations).values({id:other,key:'other-test',name:'Other fictional organisation'});
 await database.insert(clinical.appointmentEvents).values({organisationId:other,action:'appointments.cancel'});
 const feed=await listNotificationFeed({page:0});assert.ok(feed.ok);assert.equal(feed.data.events.length,1);assert.equal(feed.data.events[0].action,'appointments.requested');
 assert.ok(!JSON.stringify(feed.data).includes(patient.name));assert.ok(!JSON.stringify(feed.data).includes(patient.email));
 const inbox=await listAppointments({});assert.ok(inbox.ok);assert.equal(inbox.data.messages[0].deliveryStatus,null);
 assert.equal(notificationStateLabel(inbox.data.messages[0]),'Accepted by provider');
 assert.equal((await POST(request(signed({})))).status,404,'Webhook remains off by default');
 process.env.CLINICAL_EMAIL_EVENTS_ENABLED='true';
 const event={notificationType:'Delivery',mail:{source:'sender@example.test',sendingAccountId:'111111111111',headers:[{name:'X-Emcrown-Notification-ID',value:messageId}]},delivery:{timestamp:new Date().toISOString(),recipients:[patient.email]}};
 const envelope=signed(event);assert.equal((await verifySns(envelope,topic)).MessageId,envelope.MessageId);
 assert.ok(outgoing.some(item=>item.path.endsWith('.pem')),'Real certificate HTTP path must run');
 await assert.rejects(verifySns({...envelope,Message:'tampered'},topic));
 await assert.rejects(verifySns({...envelope,TopicArn:topic+'-wrong'},topic));
 const calls=outgoing.length;
 await assert.rejects(verifySns({...envelope,SigningCertURL:'https://evil.example.test/cert.pem'},topic));assert.equal(outgoing.length,calls,'Untrusted certificate URLs never fetch');
 await assert.rejects(verifySns({...envelope,SignatureVersion:'1'},topic));
 assert.equal((await POST(request({...envelope,Message:'tampered'}))).status,403);
 assert.equal((await POST(new Request('http://localhost:3000/api/booking/email/status',{method:'POST',body:'not json'}))).status,400);
 assert.equal((await POST(request(envelope))).status,204);
 assert.equal((await POST(request(envelope))).status,204,'Replay is acknowledged');
 let rows=await database.select().from(clinical.notificationDelivery);assert.equal(rows.length,1);assert.equal(rows[0].status,'delivered');
 let events=await database.select().from(clinical.appointmentEvents).where(and(eq(clinical.appointmentEvents.organisationId,org),eq(clinical.appointmentEvents.action,'notifications.email_delivered')));assert.equal(events.length,1,'Replay must not duplicate activity');
 const tracked=await listAppointments({});assert.equal(tracked.data.messages[0].deliveryStatus,'delivered');
 assert.equal(emailOutcome({...event,mail:{...event.mail,source:'other@example.test'}},'sender@example.test','111111111111'),null);
 assert.equal(emailOutcome({...event,mail:{...event.mail,headers:[]}},'sender@example.test','111111111111'),null);
 const wrong=emailOutcome({...event,delivery:{...event.delivery,recipients:['other@example.test']}},'sender@example.test','111111111111');await recordDelivery({...wrong,status:'complained'});
 rows=await database.select().from(clinical.notificationDelivery);assert.equal(rows[0].status,'delivered','Wrong recipient cannot alter status');
 const bounce={...event,notificationType:'Bounce',bounce:{timestamp:new Date().toISOString(),bouncedRecipients:[{emailAddress:patient.email}]}};
 assert.equal((await POST(request(signed(bounce)))).status,204);
 await POST(request(envelope));rows=await database.select().from(clinical.notificationDelivery);assert.equal(rows[0].status,'bounced','Late delivery cannot hide bounce');
 const complaint={...event,notificationType:'Complaint',complaint:{timestamp:new Date().toISOString(),complainedRecipients:[{emailAddress:patient.email}]}};
 await POST(request(signed(complaint)));await POST(request(signed(bounce)));rows=await database.select().from(clinical.notificationDelivery);assert.equal(rows[0].status,'complained','Complaint is sticky');
 const confirmation=signed({},'SubscriptionConfirmation');await verifySns(confirmation,topic);await confirmSns(confirmation);assert.equal((await POST(request(confirmation))).status,204);assert.ok(outgoing.some(item=>item.action==='ConfirmSubscription'));
 const saved=await writePhysician({id:physicianId,version:1,profile:{...profile,notifyAppointments:true},operation:'save'});assert.ok(saved.ok);
 const stale=await writePhysician({id:physicianId,version:1,profile,operation:'save'});assert.equal(stale.code,'conflict');
 const response=await GET(new Request('http://localhost:3000/emcrown-admin/notifications/api?page=0'));assert.equal(response.status,200);
 const result=await response.json();assert.ok(result.ok);assert.equal(result.data.attention[0].state,'complained');
 assert.ok(!JSON.stringify(result).includes(patient.name));assert.ok(!JSON.stringify(result).includes(patient.reason));assert.ok(!JSON.stringify(result).includes(patient.email));
 await database.insert(clinical.appointmentEvents).values(Array.from({length:27},()=>({organisationId:org,appointmentId,action:'appointments.requested'})));
 const paged=await listNotificationFeed({page:0});assert.equal(paged.data.events.length,25);assert.equal(paged.data.hasMore,true);
 assert.equal((await listNotificationFeed({page:1})).data.events.some(item=>item.action==='appointments.cancel'),false,'Other tenant events stay hidden on later pages');
 await database.update(tables.memberships).set({role:'staff'}).where(eq(tables.memberships.userId,owner.id));
 assert.ok((await listNotificationFeed({page:0})).ok,'Staff can read appointment alerts');
 assert.equal((await writePhysician({id:physicianId,version:2,profile,operation:'save'})).code,'denied','Staff cannot change physician preferences');
 const {clearSessionCookie}=require('../src/features/auth/session.ts');await clearSessionCookie();assert.equal((await GET(new Request('http://localhost:3000/emcrown-admin/notifications/api'))).status,401);
 console.log('Notification integration passed: migration, tenant/privacy guards, acceptance vs delivery, signed HTTP certificate/confirmation, tamper/SSRF rejection, recipient correlation, replay/order handling, physician toggle conflicts and API authentication. No real email sent.');
}
main().catch(error=>{console.error('Notification integration failed: '+(error.code||error.name||'unknown'));if(error.actual!==undefined)console.error('Assertion values: '+JSON.stringify({actual:error.actual,expected:error.expected}));console.error(error.stack?.split('\n').find(line=>line.includes('tests/notifications.cjs'))||'');process.exitCode=1;}).finally(async()=>{global.fetch=realFetch;if(database)await database.$client.end();});
