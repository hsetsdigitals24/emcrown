// Read-only staging worker readiness: no job claims, record writes, SMTP connections or AWS deployment.
/* eslint-disable @typescript-eslint/no-require-imports -- Standalone operational tooling. */
let stage="local-settings";
async function main() {
  if(process.argv.length!==2) throw new Error("No arguments are accepted.");
  const settings=require("./staging-load.cjs").loadStaging();
  stage="worker-settings";
  const fs=require("node:fs");
  const names=Object.keys(JSON.parse(fs.readFileSync("infrastructure/lambda/settings.example.json","utf8")));
  const {configureWorker,runWorker}=require("../src/features/messaging/handler.ts");
  configureWorker(Object.fromEntries(names.map(name=>[name,settings[name]])));
  stage="database-readiness";
  const result=await runWorker({operation:"check-configuration"},{getRemainingTimeInMillis:()=>300000});
  if(result.ready!==true) throw new Error("Worker readiness check failed.");
  console.log("Staging check passed: password accepted, verified TLS, restricted staging role, required worker permissions and live-schema isolation.");
  console.log("Metadata only: no records changed, emails sent or AWS resources created. SMTP delivery remains untested.");
}
main().catch(error=>{
  const codes=["28P01","42501","XX000","ENOTFOUND","EAI_AGAIN","ECONNREFUSED","CONNECT_TIMEOUT","CERT_HAS_EXPIRED","SELF_SIGNED_CERT_IN_CHAIN","UNABLE_TO_VERIFY_LEAF_SIGNATURE"];
  // Drizzle wraps driver failures; inspect only known machine codes, never query text or parameters.
  let failure=error,code="unclassified";
  for(let depth=0;failure&&depth<5;depth++,failure=failure.cause) if(codes.includes(failure.code)) {code=failure.code;break;}
  console.error("Staging check failed",{stage,code});
  const reasons=new Map([
    ["Clinical booking requires the dedicated least-privilege emcrown_staging_runtime database role.","Runtime role or elevated privileges rejected."],
    ["Staging database permissions are not isolated.","Live schema access, public creation or role membership detected."],
    ["Email worker database permissions are incomplete.","Required staging worker privileges are missing."],
    ["Staging requires its restricted database login.","Staging connection has the wrong database username."],
  ]);
  if(reasons.has(error?.message)) console.error(reasons.get(error.message));
  console.error("Verify the private staging file, password, TLS and restricted database grants. No credentials were displayed.");process.exitCode=1;
});
