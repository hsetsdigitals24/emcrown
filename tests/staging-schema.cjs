// Local PostgreSQL 16 isolation test: starts a private loopback-only cluster, stops it, never uses hosted URLs.
/* eslint-disable @typescript-eslint/no-require-imports */
const fs=require("node:fs"),os=require("node:os"),path=require("node:path"),net=require("node:net");
const {spawnSync,spawn}=require("node:child_process");
const {randomBytes,createHash}=require("node:crypto");
const assert=require("node:assert/strict");
const postgres=require("postgres");
const {stagingSql}=require("../scripts/staging-sql.cjs");
const bin="/usr/lib/postgresql/16/bin";
const root=fs.mkdtempSync(path.join(os.tmpdir(),"emcrown-isolation-"));fs.chmodSync(root,0o700);
const data=path.join(root,"data"),cert=path.join(root,"server.crt"),key=path.join(root,"server.key");
let running=false,client,phase="prepare";
function command(file,args) {const result=spawnSync(file,args,{stdio:"pipe",encoding:"utf8"});if(result.status!==0) throw new Error("Local test setup command failed.");}
function freePort(){return new Promise((resolve,reject)=>{const server=net.createServer();server.on("error",reject);server.listen(0,"127.0.0.1",()=>{const port=server.address().port;server.close(()=>resolve(port));});});}
function child(scope,settings){return new Promise((resolve,reject)=>{
  const proc=spawn(process.execPath,["--conditions=react-server","tests/staging-worker-child.cjs"],{env:{...process.env,NODE_ENV:"production",EMCROWN_DATABASE_SCOPE:scope,ISOLATION_SETTINGS:JSON.stringify(settings)},stdio:["ignore","pipe","pipe"]});
  let output="";proc.stdout.on("data",bytes=>output+=bytes);proc.stderr.resume();
  proc.on("error",reject);proc.on("exit",code=>code===0?resolve(JSON.parse(output.trim())):reject(new Error("Namespace child failed.")));
});}
async function main(){
  command(process.execPath,["scripts/package-worker.cjs"]);
  const password=randomBytes(32).toString("hex"),pwfile=path.join(root,"password");fs.writeFileSync(pwfile,password,{mode:0o600});
  command("openssl",["req","-x509","-newkey","rsa:2048","-nodes","-days","2","-keyout",key,"-out",cert,"-subj","/CN=localhost","-addext","subjectAltName=DNS:localhost,IP:127.0.0.1","-addext","basicConstraints=critical,CA:TRUE"]);
  fs.chmodSync(key,0o600);command(path.join(bin,"initdb"),["-D",data,"-U","postgres","--pwfile",pwfile,"--auth-host=scram-sha-256","--auth-local=trust","--no-locale"]);
  const port=await freePort();phase="start";
  command(path.join(bin,"pg_ctl"),["-D",data,"-l",path.join(root,"server.log"),"-o",`-p ${port} -h 127.0.0.1 -k ${root} -c ssl=on -c ssl_cert_file=${cert} -c ssl_key_file=${key}`,"-w","start"]);running=true;
  const url=new URL(`postgres://postgres@127.0.0.1:${port}/postgres`);url.password=password;
  const ca=fs.readFileSync(cert,"utf8");client=postgres(url.href,{ssl:{rejectUnauthorized:true,ca},max:1,onnotice:()=>{}});
  phase="live-schema";
  const journal=JSON.parse(fs.readFileSync("drizzle/meta/_journal.json"));
  for(const entry of journal.entries)await client.unsafe(fs.readFileSync(`drizzle/${entry.tag}.sql`,"utf8"));
  await client.unsafe("CREATE SCHEMA drizzle; CREATE TABLE drizzle.__drizzle_migrations (hash text NOT NULL, created_at bigint NOT NULL)");
  const last=journal.entries.at(-1),lastHash=createHash("sha256").update(fs.readFileSync(`drizzle/${last.tag}.sql`)).digest("hex");
  await client`insert into drizzle.__drizzle_migrations values (${lastHash},${last.when})`;
  await client.unsafe("CREATE ROLE emcrown_runtime LOGIN NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS");
  await client.unsafe(fs.readFileSync("infrastructure/database/runtime-grants.sql","utf8"));
  phase="staging-schema";
  const {applyReviewed,preflight}=require("../scripts/staging-apply.cjs");
  assert.equal((await preflight(client)).ready,true);
  assert.equal((await applyReviewed(client,stagingSql())).liveMetadataUnchanged,true);
  await assert.rejects(applyReviewed(client,stagingSql()),/preflight/);
  const rolePassword=randomBytes(32).toString("hex");
  for(const role of ["emcrown_runtime","emcrown_staging_runtime"]){
    // Utility statements cannot bind PASSWORD directly; PostgreSQL quotes this generated secret with %L.
    const [row]=await client`select format('ALTER ROLE %I LOGIN PASSWORD %L',${role}::text,${rolePassword}::text) as command`;
    await client.unsafe(row.command);
  }
  phase="fixtures";const {fixtureSettings,seedFixture}=require("./staging-fixtures.cjs");
  const settings={};
  for(const scope of ["live","staging"]){const runtime=new URL(url);runtime.username=scope==="live"?"emcrown_runtime":"emcrown_staging_runtime";runtime.password=rolePassword;
    settings[scope]=fixtureSettings(runtime.href,ca,scope);await seedFixture(client,scope==="live"?"emcrown_admin":"emcrown_staging",settings[scope]);}
  phase="staging-worker";const result=await child("staging",settings.staging);assert.ok(result.crossSchemaDenied);
  const [live]=await client`select state from emcrown_admin.appointment_messages`;assert.equal(live.state,"queued");
  const [liveMail]=await client`select count(*)::int as count from emcrown_admin.mail_outbox`;assert.equal(liveMail.count,1);
  phase="live-worker";assert.ok((await child("live",settings.live)).crossSchemaDenied);
  for(const schema of ["emcrown_admin","emcrown_staging"]){const [row]=await client`select state from ${client(schema)}.appointment_messages`;assert.equal(row.state,"sent");}
  console.log("Local isolation passed: complete separate schemas, restricted roles, cross-schema reads/writes/functions/SET ROLE denied, each worker handles only its own account and appointment queue. SMTP stayed in memory.");
}
main().catch(error=>{console.error(`Local staging isolation failed during ${phase}; code ${String(error.code??error.cause?.code??"none").replace(/[^A-Z0-9_]/gi,"")}; constraint ${String(error.constraint_name??"none").replace(/[^A-Z0-9_]/gi,"")}. No hosted database or real SMTP was used.`);process.exitCode=1;}).finally(async()=>{
  try {if(client)await client.end({timeout:3});} finally {if(running)command(path.join(bin,"pg_ctl"),["-D",data,"-m","fast","-w","stop"]);}
});
