// Operator-only approved staging bootstrap: verified target/TLS, metadata preflight, atomic apply and private diagnostics.
/* eslint-disable @typescript-eslint/no-require-imports -- Existing server-only operations loader. */
require("./auth.cjs");
const fs=require("node:fs"),{createHash}=require("node:crypto");
const postgres=require("postgres");
const {databaseTls}=require("../src/lib/db/tls.ts");
const {stagingSql}=require("./staging-sql.cjs");
const journal=JSON.parse(fs.readFileSync("drizzle/meta/_journal.json","utf8"));
const hash=value=>createHash("sha256").update(value).digest("hex");
function projectReference(value) {
  const url=new URL(value),username=decodeURIComponent(url.username);
  return username.includes(".")?username.split(".").at(-1):/^db\.([a-z0-9]+)\./.exec(url.hostname)?.[1];
}
async function liveFingerprint(client) {
  const relations=await client`select c.relname,c.relkind,c.relowner,c.relacl,c.relrowsecurity
    from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='emcrown_admin' order by c.relname`;
  const columns=await client`select c.relname,a.attname,a.atttypid,a.atttypmod,a.attnotnull
    from pg_attribute a join pg_class c on c.oid=a.attrelid join pg_namespace n on n.oid=c.relnamespace
    where n.nspname='emcrown_admin' and a.attnum>0 and not a.attisdropped order by c.relname,a.attnum`;
  const functions=await client`select p.proname,pg_get_function_identity_arguments(p.oid) as arguments,
    pg_get_functiondef(p.oid) as definition,p.proacl,p.proowner
    from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='emcrown_admin' and p.prokind in ('f','p') order by p.proname,arguments`;
  const schema=await client`select nspacl,nspowner from pg_namespace where nspname='emcrown_admin'`;
  return hash(JSON.stringify({relations,columns,functions,schema}));
}
async function preflight(client) {
  const [state]=await client`select
    exists(select 1 from pg_namespace where nspname='emcrown_admin') as live_present,
    exists(select 1 from pg_namespace where nspname='emcrown_staging') as stage_present,
    exists(select 1 from pg_roles where rolname='emcrown_staging_runtime') as stage_role_present,
    exists(select 1 from pg_roles where rolname='emcrown_runtime') as live_role_present,
    exists(select 1 from pg_extension where extname='btree_gist') as extension_present,
    (select rolcreaterole from pg_roles where rolname=current_user) as can_create_role,
    has_database_privilege(current_user,current_database(),'CREATE') as can_create_schema,
    to_regclass('drizzle.__drizzle_migrations') is not null as ledger_present`;
  const last=journal.entries.at(-1);
  const expected=hash(fs.readFileSync(`drizzle/${last.tag}.sql`));
  const rows=state.ledger_present?await client`select hash from drizzle.__drizzle_migrations order by created_at desc limit 1`:[];
  const result={...state,live_migration_matches:rows[0]?.hash===expected};
  return {...result,ready:result.live_present&&!result.stage_present&&!result.stage_role_present&&result.live_role_present&&result.extension_present&&result.can_create_role&&result.can_create_schema&&result.live_migration_matches};
}
async function verifyStaging(client) {
  const [role]=await client`select rolcanlogin,rolsuper,rolcreaterole,rolcreatedb,rolbypassrls,rolinherit,
    exists(select 1 from pg_auth_members where member=pg_roles.oid) as membership
    from pg_roles where rolname='emcrown_staging_runtime'`;
  const [boundary]=await client`select has_schema_privilege('emcrown_staging_runtime','emcrown_admin','USAGE') as stage_to_live,
    has_schema_privilege('emcrown_runtime','emcrown_staging','USAGE') as live_to_stage,
    has_schema_privilege('emcrown_staging_runtime','public','CREATE') as public_create`;
  const rows=await client`select tag,source_hash from emcrown_staging.__staging_migrations order by tag`;
  const expected=journal.entries.map(entry=>({tag:entry.tag,source_hash:hash(fs.readFileSync(`drizzle/${entry.tag}.sql`))}));
  const valid=role&&!Object.values(role).some(Boolean)&&boundary&&!Object.values(boundary).some(Boolean)&&JSON.stringify(rows)===JSON.stringify(expected);
  if (!valid) throw new Error("Staging verification failed.");
  return {loginDisabled:true,crossSchemaAccessDenied:true,sourceMigrationsVerified:rows.length};
}
async function applyReviewed(client,source) {
  if (source!==stagingSql()) throw new Error("Artifact does not match reviewed sources.");
  return client.begin(async tx=>{
    if (!(await preflight(tx)).ready) throw new Error("Staging preflight refused the operation.");
    const before=await liveFingerprint(tx);
    // The reviewed file owns its transaction in SQL Editor; postgres.begin owns the same boundary here.
    await tx.unsafe(source.replace(/^BEGIN;\n/m,"").replace(/^COMMIT;\n/m,""));
    const result=await verifyStaging(tx);
    if (before!==await liveFingerprint(tx)) throw new Error("Live metadata changed; staging transaction aborted.");
    return {...result,liveMetadataUnchanged:true};
  });
}
async function main() {
  const mode=process.argv[2]??"check";
  if (!["check","apply"].includes(mode)) throw new Error("Unknown operation.");
  const runtime=process.env.DATABASE_URL,migration=process.env.DATABASE_MIGRATION_URL,service=process.env.SUPABASE_URL;
  if (!runtime||!migration||!service||!projectReference(runtime)||projectReference(runtime)!==projectReference(migration)||new URL(service).hostname.split(".")[0]!==projectReference(migration)) throw new Error("Project target mismatch.");
  const source=fs.readFileSync("artifacts/staging/staging-bootstrap.sql","utf8"),digest=hash(source);
  if (source!==stagingSql()||(mode==="apply"&&process.argv[3]!==digest)) throw new Error("Reviewed artifact hash mismatch.");
  const client=postgres(migration,{max:1,prepare:false,connect_timeout:10,idle_timeout:5,ssl:databaseTls(process.env.DATABASE_CA_CERT),
    connection:{application_name:"emcrown_staging_bootstrap",statement_timeout:120000,lock_timeout:5000},onnotice:()=>{}});
  try {
    const state=await preflight(client);console.log(JSON.stringify({targetMatched:true,artifactSha256:digest,...state}));
    if (mode==="apply") {if(!state.ready)throw new Error("Preflight refused.");console.log(JSON.stringify(await applyReviewed(client,source)));}
  } finally {await client.end({timeout:5});}
}
module.exports={preflight,verifyStaging,applyReviewed,liveFingerprint,projectReference};
if(require.main===module)main().catch(error=>{const code=String(error.code??error.cause?.code??"none").replace(/[^A-Z0-9_]/gi,"");console.error(`Staging operation failed; safe code ${code}. No credentials or records logged.`);process.exitCode=1;});
