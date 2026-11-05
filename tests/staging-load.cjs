// Local-only loader isolation regression: fictional files and inherited credentials; no network calls.
/* eslint-disable @typescript-eslint/no-require-imports */
const assert=require("node:assert/strict"),fs=require("node:fs"),os=require("node:os"),path=require("node:path");
const {spawnSync}=require("node:child_process");
const {buildSettings,serializeSettings}=require("../scripts/staging-settings.cjs");
const folder=fs.mkdtempSync(path.join(os.tmpdir(),"emcrown-stage-loader-"));
fs.chmodSync(folder,0o700);
const template=fs.readFileSync(".env.example","utf8");fs.writeFileSync(path.join(folder,".env.example"),template);
const settings=buildSettings({DATABASE_URL:"postgres://emcrown_runtime.fictional:old@pooler.example.test:6543/postgres",AUTH_ORIGIN:"https://live.example.test"},
  template,"fake:p@$word","http://localhost:3109","review@example.test");
fs.writeFileSync(path.join(folder,".env"),"DATABASE_URL=postgres://postgres:fake-owner@live.example.test/postgres\nAUTH_SECRET=live-key\n");
const filename=path.join(folder,".env.staging");
function save(value,mode=0o600) {fs.writeFileSync(filename,serializeSettings(value),{mode:0o600});fs.chmodSync(filename,mode);}
function run(success) {
  const script=`const assert=require('node:assert/strict');try{const settings=require(${JSON.stringify(path.resolve("scripts/staging-load.cjs"))}).loadStaging();
    assert.equal(process.env.DATABASE_URL,settings.DATABASE_URL);assert.equal(process.env.EMCROWN_DATABASE_SCOPE,'staging');
    assert.equal(process.env.DATABASE_MIGRATION_URL,'');assert.equal(process.env.SUPABASE_SERVICE_ROLE_KEY,'');
    assert.equal(decodeURIComponent(new URL(settings.DATABASE_URL).password),'fake:p@$word');
    process.exitCode=${success?0:2};}catch{process.exitCode=${success?3:0};}`;
  const result=spawnSync(process.execPath,["--conditions=react-server","-e",script],{cwd:folder,encoding:"utf8",
    env:{...process.env,DATABASE_URL:"postgres://postgres:inherited-fake@wrong.example.test/postgres",DATABASE_MIGRATION_URL:"inherited-owner",EMCROWN_DATABASE_SCOPE:"live",SUPABASE_SERVICE_ROLE_KEY:"inherited-fake-key"}});
  assert.equal(result.status,0,"Loader isolation assertion failed; subprocess output withheld.");
}
save(settings);run(true);
save({...settings,DATABASE_URL:"postgres://emcrown_runtime.fictional:fake@pooler.example.test/postgres"});run(false);
save({...settings,EMCROWN_DATABASE_SCOPE:"live"});run(false);
save({...settings,WORKER_DELIVERY_ENABLED:"true"});run(false);
save({...settings,SUPABASE_SERVICE_ROLE_KEY:"fake-owner-key"});run(false);
const missing={...settings};delete missing.AUTH_SECRET;save(missing);run(false);
save(settings,0o644);run(false);
console.log("Staging loader checks passed: live/inherited settings replaced; wrong role, enabled delivery, owner keys, incomplete and public files rejected. No network calls.");
