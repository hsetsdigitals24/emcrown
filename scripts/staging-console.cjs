// Operator-only psql launcher: target the verified Supabase project with saved credentials, never the default local socket.
/* eslint-disable @typescript-eslint/no-require-imports -- Standalone operational tooling. */
require("./auth.cjs");
const fs=require("node:fs"),path=require("node:path"),os=require("node:os");
const {spawnSync}=require("node:child_process");
const {databaseTls}=require("../src/lib/db/tls.ts");
const {projectReference}=require("./staging-apply.cjs");
function consoleSettings(value,certificate,base=process.env) {
  const url=new URL(value);
  if (!["postgres:","postgresql:"].includes(url.protocol)||!url.hostname||!url.password) throw new Error("Connection settings are incomplete.");
  // Do not let an old PGHOST/PGSERVICE/PGOPTIONS redirect this connection or weaken TLS.
  const environment=Object.fromEntries(Object.entries(base).filter(([name])=>!name.startsWith("PG")));
  return {env:{...environment,PGHOST:url.hostname,PGPORT:url.port||"5432",PGDATABASE:decodeURIComponent(url.pathname.slice(1)),
    PGUSER:decodeURIComponent(url.username),PGPASSWORD:decodeURIComponent(url.password),PGSSLMODE:"verify-full",PGSSLROOTCERT:certificate,
    PGAPPNAME:"emcrown_staging_setup",PGCONNECT_TIMEOUT:"10",PSQL_HISTORY:os.devNull},args:["-X","-v","ON_ERROR_STOP=1"]};
}
function main() {
  const flags=process.argv.slice(2);
  if (flags.length>1||(flags.length===1&&flags[0]!=="--check")) throw new Error("Use no arguments or --check.");
  const migration=process.env.DATABASE_MIGRATION_URL,runtime=process.env.DATABASE_URL,service=process.env.SUPABASE_URL;
  if (!migration||!runtime||!service||!projectReference(runtime)||projectReference(runtime)!==projectReference(migration)||new URL(service).hostname.split(".")[0]!==projectReference(migration)) throw new Error("Project connection settings do not match.");
  const tls=databaseTls(process.env.DATABASE_CA_CERT);
  let certificate="/etc/ssl/certs/ca-certificates.crt";
  if (typeof tls.ca==="string") {
    // Only the public CA certificate is written temporarily; database passwords stay in the child environment.
    const folder=fs.mkdtempSync(path.join(os.tmpdir(),"emcrown-psql-ca-"));fs.chmodSync(folder,0o700);
    certificate=path.join(folder,"root.crt");fs.writeFileSync(certificate,tls.ca,{mode:0o600});
  }
  if (!fs.existsSync(certificate)) throw new Error("Database CA bundle is unavailable.");
  const options=consoleSettings(migration,certificate);
  if (flags[0]==="--check") {
    options.env.PGOPTIONS="-c default_transaction_read_only=on";
    options.args.push("-c","select exists(select 1 from pg_namespace where nspname='emcrown_staging') as staging_schema_present, exists(select 1 from pg_roles where rolname='emcrown_staging_runtime' and not rolcanlogin) as staging_login_disabled;");
  } else console.log("Opening the Supabase ADMIN console for staging setup. No SQL is run automatically. Use only the reviewed staging commands; \\q exits.");
  const result=spawnSync("psql",options.args,{env:options.env,stdio:"inherit"});
  if (result.error) throw new Error("Could not start psql.");
  process.exitCode=result.status??1;
}
module.exports={consoleSettings};
if(require.main===module)try{main();}catch{console.error("Supabase console could not open. Check saved migration settings, TLS CA and psql installation; no credentials were displayed.");process.exitCode=1;}
