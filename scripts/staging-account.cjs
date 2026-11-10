// Operator-only staging fixture: one approved reviewer account with an unknown random password; no email jobs.
/* eslint-disable @typescript-eslint/no-require-imports -- Standalone operational tooling. */
require("./auth.cjs");
const ownerUrl=process.env.DATABASE_MIGRATION_URL;
async function main() {
  const apply=process.argv.length===3&&process.argv[2]==="--apply";
  if(process.argv.length!==2&&!apply) throw new Error("Use no arguments to review, or --apply.");
  const settings=require("./staging-load.cjs").loadStaging();
  const {projectReference}=require("./staging-apply.cjs");
  if(!ownerUrl||!projectReference(ownerUrl)||projectReference(ownerUrl)!==projectReference(settings.DATABASE_URL)) throw new Error("Project mismatch.");
  const {reviewRecipientAllowed}=require("../src/features/clinical/review.ts");
  const email=settings.SUPER_ADMIN_EMAIL.trim().toLowerCase();
  if(!reviewRecipientAllowed(email)) throw new Error("Reviewer is not approved.");
  const {assertWorkerRuntime}=require("../src/features/messaging/runtime.ts");
  const {closeDatabase}=require("../src/lib/db/index.ts");
  try {await assertWorkerRuntime();} finally {await closeDatabase();}
  const {databaseTls}=require("../src/lib/db/tls.ts");
  const client=require("postgres")(ownerUrl,{max:1,prepare:false,connect_timeout:10,ssl:databaseTls(settings.DATABASE_CA_CERT),onnotice:()=>{}});
  try {
    const [{count}]=await client`select (select count(*) from emcrown_staging.organisations)+(select count(*) from emcrown_staging.users)+(select count(*) from emcrown_staging.memberships) as count`;
    if(Number(count)!==0) throw new Error("Staging accounts already exist; refusing to overwrite them.");
    console.log("Plan: create one fictional staging organisation and one staff account for the SUPER_ADMIN_EMAIL test inbox from .env.staging.");
    console.log("No ownership/admin privileges, patient records or mail jobs will be created. Initial password will be random and undisclosed.");
    if(!apply) {console.log("Review only. Run npm run staging:account -- --apply to create these staging records.");return;}
    const {hashPassword}=require("../src/features/auth/crypto.ts");
    const hash=await hashPassword(require("node:crypto").randomBytes(48).toString("hex"));
    await client.begin(async tx=>{
      await tx`select pg_advisory_xact_lock(186734912)`;
      // Refuse concurrent setup; never reset or elevate any existing account.
      const [{count:existing}]=await tx`select (select count(*) from emcrown_staging.organisations)+(select count(*) from emcrown_staging.users)+(select count(*) from emcrown_staging.memberships) as count`;
      if(Number(existing)!==0) throw new Error("Staging account setup is no longer empty.");
      const [organisation]=await tx`insert into emcrown_staging.organisations (name,key) values ('Fictional staging practice','emcrown') returning id`;
      const [user]=await tx`insert into emcrown_staging.users (email,password_hash) values (${email},${hash}) returning id`;
      await tx`insert into emcrown_staging.memberships (organisation_id,user_id,role) values (${organisation.id},${user.id},'staff')`;
      await tx`insert into emcrown_staging.audit_events (organisation_id,actor_id,actor_role,action,outcome) values (${organisation.id},${user.id},'staff','organisation.seeded','success')`;
    });
    console.log("Created staging test account. Request a password reset through the staging website; no emails were sent by this command.");
  } finally {await client.end({timeout:5});}
}
main().catch(()=>{console.error("Staging account setup stopped. Check staging readiness, matching owner connection, approved reviewer and empty staging account tables. No credentials were displayed.");process.exitCode=1;});
