// Local operator configuration loader: replace live settings before importing any scoped application module.
/* eslint-disable @typescript-eslint/no-require-imports -- Standalone operational tooling. */
const fs=require("node:fs");
function loadStaging() {
  const filename=".env.staging";
  const stat=fs.lstatSync(filename);
  if(!stat.isFile()||(stat.mode&0o077)!==0) throw new Error("Staging settings require a private regular file.");
  const names=[...fs.readFileSync(".env.example","utf8").matchAll(/^([A-Z][A-Z0-9_]*)=/gm)].map(match=>match[1]);
  // Install TypeScript support first; its normal .env loading must finish before staging replaces it.
  require("./auth.cjs");
  for(const name of names) delete process.env[name];
  const file={path:filename,contents:fs.readFileSync(filename,"utf8"),env:{}};
  require("@next/env").processEnv([file],process.cwd(),{error(){throw new Error("Staging dotenv parsing failed.");}},true);
  const settings=file.env;
  if(names.some(name=>!Object.hasOwn(settings,name))||Object.keys(settings).some(name=>!names.includes(name))) throw new Error("Staging settings do not match the configuration template.");
  if(settings.EMCROWN_DATABASE_SCOPE!=="staging"||settings.CLINICAL_REVIEW_MODE!=="true"||
    ["CLINICAL_SMS_ENABLED","CLINICAL_BOOKING_ENABLED","WORKER_DELIVERY_ENABLED","CLINICAL_EMAIL_EVENTS_ENABLED"].some(name=>settings[name]!=="false")||
    ["DATABASE_MIGRATION_URL","SUPABASE_SERVICE_ROLE_KEY","CRON_SECRET","WORKER_SETTINGS_JSON","AWS_ACCESS_KEY_ID","AWS_SECRET_ACCESS_KEY","AWS_SESSION_TOKEN"].some(name=>settings[name]!=="")) throw new Error("Staging isolation gates are invalid.");
  const username=decodeURIComponent(new URL(settings.DATABASE_URL).username).split(".")[0];
  if(username!=="emcrown_staging_runtime") throw new Error("Staging requires its restricted login.");
  Object.assign(process.env,settings);
  return settings;
}
module.exports={loadStaging};
