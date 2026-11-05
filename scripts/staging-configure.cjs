// Interactive local staging setup: hidden password input, exclusive private file, no database writes or mail.
/* eslint-disable @typescript-eslint/no-require-imports -- Standalone operational tooling. */
require("./auth.cjs");
const fs=require("node:fs"),readline=require("node:readline/promises");
const {Writable}=require("node:stream");
const {buildSettings,serializeSettings}=require("./staging-settings.cjs");
async function main() {
  const updatePassword=process.argv.length===3&&process.argv[2]==="--password-only";
  if((process.argv.length!==2&&!updatePassword)||!process.stdin.isTTY||!process.stdout.isTTY) throw new Error("Run interactively.");
  if(!updatePassword&&fs.existsSync(".env.staging")) throw new Error(".env.staging already exists; it was not overwritten.");
  const existing=updatePassword?require("./staging-load.cjs").loadStaging():null;
  let hidden=false;
  const output=new Writable({write(chunk,encoding,callback){if(!hidden) process.stdout.write(chunk,encoding);callback();}});
  const terminal=readline.createInterface({input:process.stdin,output,terminal:true});
  try {
    let origin,recipients;
    if(existing) console.log("Update only the saved staging database password. Encryption keys and other settings are preserved; no remote password reset is performed.");
    else {
      console.log("This creates .env.staging only. No database changes, emails or AWS resources.");
      origin=(await terminal.question("Staging website origin [http://localhost:3109]: ")).trim()||"http://localhost:3109";
      console.log("Reuse existing SMTP credentials for later tests? Delivery stays disabled.");
      if((await terminal.question("Type yes to reuse SMTP settings: ")).trim().toLowerCase()!=="yes") throw new Error("Cancelled; no configuration written.");
      recipients=(await terminal.question("Approved test inboxes, comma separated (first is the staging admin/staff inbox): ")).trim();
    }
    process.stdout.write("Staging database password (hidden): ");hidden=true;
    const password=await terminal.question("");hidden=false;process.stdout.write("\n");
    process.stdout.write("Confirm password (hidden): ");hidden=true;
    const confirmation=await terminal.question("");hidden=false;process.stdout.write("\n");
    if(!password||password!==confirmation) throw new Error("Passwords do not match; nothing written.");
    const settings=existing?require("./staging-settings.cjs").replacePassword(existing,password):buildSettings(process.env,fs.readFileSync(".env.example","utf8"),password,origin,recipients);
    // Validate configuration locally without connecting to a database or SMTP server.
    require("../src/features/messaging/settings.ts").configureWorker(settingsForWorker(settings));
    const contents=serializeSettings(settings);
    if(existing) {
      const temporary=`.env.staging.${require("node:crypto").randomBytes(12).toString("hex")}.tmp`;
      fs.writeFileSync(temporary,contents,{flag:"wx",mode:0o600});
      fs.renameSync(temporary,".env.staging");
    } else fs.writeFileSync(".env.staging",contents,{flag:"wx",mode:0o600});
    console.log(existing?"Saved staging password only; existing keys preserved. Run npm run staging:check.":"Saved private .env.staging with independent keys. Live .env is unchanged. Password authentication is not yet checked.");
    console.log("Staging is not running. Next: read-only staging connection check, then fictional test records before delivery approval.");
  } finally {hidden=false;terminal.close();}
}
function settingsForWorker(settings) {
  const names=Object.keys(JSON.parse(fs.readFileSync("infrastructure/lambda/settings.example.json","utf8")));
  return Object.fromEntries(names.map(name=>[name,settings[name]??""]));
}
main().catch(()=>{console.error("Staging configuration was not completed. Check your entries, SMTP settings and whether .env.staging already exists. No credentials were displayed.");process.exitCode=1;});
