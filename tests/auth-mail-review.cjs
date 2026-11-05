// Local account-email boundary tests: real worker with in-memory DB/SMTP substitutes; no network or messages.
/* eslint-disable @typescript-eslint/no-require-imports */
require("../scripts/auth.cjs");
const assert = require("node:assert/strict");
const { randomBytes, randomUUID } = require("node:crypto");
Object.assign(process.env,{NODE_ENV:"development",DATABASE_URL:"postgres://unused:unused@localhost/unused",AUTH_ORIGIN:"http://localhost:3109",
  AUTH_SECRET:randomBytes(32).toString("hex"),SUPER_ADMIN_EMAIL:"reviewer@example.test",ORGANISATION_NAME:"Fictional staging practice",
  SMTP_HOST:"localhost",SMTP_PORT:"587",SMTP_USER:"fictional",SMTP_PASSWORD:"fictional",SMTP_FROM:"practice@example.test",
  CLINICAL_REVIEW_MODE:"true",CLINICAL_REVIEW_EMAILS:"reviewer@example.test"});
const database=require("../src/lib/db/index.ts");const nodemailer=require("nodemailer");
const tables=require("../src/lib/db/schema.ts");
const { encrypt }=require("../src/features/auth/crypto.ts");
const { deliverResetEmails }=require("../src/features/auth/mail.ts");
const originalDb=database.db, originalTransport=nodemailer.createTransport;
const userId=randomUUID(),organisationId=randomUUID();
let kind="reset",recipient="outside@example.test";
const sent=[],updates=[];
const tx={
  select(){return {from(table){
    const rows=table===tables.mailOutbox ? [{id:randomUUID(),userId,kind,payload:encrypt("fictional-token"),attempts:0}]
      : table===tables.users ? [{id:userId,email:recipient,active:kind!=="invitation"}]
      : table===tables.invitations ? [{userId,organisationId,expiresAt:new Date(Date.now()+60000)}] : [];
    const query={where(){return query;},orderBy(){return query;},for(){return query;},limit(){return Promise.resolve(rows);},then(resolve,reject){return Promise.resolve(rows).then(resolve,reject);}};
    return query;
  }};},
  delete(){return {where:async()=>{}};},
  update(){return {set(values){updates.push(values);return {where:async()=>{}};}};},
  insert(){return {values:async()=>{}};},
};
database.db=()=>({transaction:async callback=>callback(tx)});
nodemailer.createTransport=()=>({sendMail:async options=>{sent.push(options);return {accepted:[options.to],rejected:[]};}});
(async()=>{
  try {
    for(const current of ["reset","invitation"]){
      kind=current;recipient="outside@example.test";sent.length=0;updates.length=0;
      assert.equal(await deliverResetEmails(1),1);assert.equal(sent.length,0,"Review mode must block non-allowlisted account mail");
      assert.equal(updates.at(-1).attempts,1,"Blocked account jobs remain subject to existing retry/expiry policy");
      recipient="reviewer@example.test";
      assert.equal(await deliverResetEmails(1),1);assert.equal(sent.length,1);
      assert.ok(sent[0].html.includes("fictional-token"));assert.ok(sent[0].text.includes("fictional-token"));
      process.env.CLINICAL_REVIEW_MODE="false";recipient="outside@example.test";sent.length=0;
      assert.equal(await deliverResetEmails(1),1);assert.equal(sent.length,1,"Normal production account delivery remains eligible");
      process.env.CLINICAL_REVIEW_MODE="true";
    }
    console.log("Account mail checks passed: reset/invitation test-inbox enforcement, allowed HTML/plaintext and unchanged normal delivery.");
  } finally {database.db=originalDb;nodemailer.createTransport=originalTransport;}
})().catch(()=>{console.error("Account mail boundary check failed; fictional in-memory fixtures only.");process.exitCode=1;});
