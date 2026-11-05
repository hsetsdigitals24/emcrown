// Local-only staging configuration builder; never copies owner credentials or live encryption keys.
/* eslint-disable @typescript-eslint/no-require-imports -- Standalone operational tooling. */
const {randomBytes}=require("node:crypto");
const {z}=require("zod");
function stagingConnection(value,password) {
  const url=new URL(value);
  const username=decodeURIComponent(url.username);
  if (!["postgres:","postgresql:"].includes(url.protocol)||!/^emcrown_runtime(?:\.[a-z0-9]+)?$/.test(username)||!password) throw new Error("Runtime connection or password is invalid.");
  // Pooler connections retain the project suffix; the database role itself changes.
  url.username=username.replace(/^emcrown_runtime/,"emcrown_staging_runtime");
  url.password=password;
  return url.toString();
}
function buildSettings(source,template,password,origin,recipients) {
  const target=new URL(origin);
  if (target.origin!==origin||target.username||target.password||origin===source.AUTH_ORIGIN||
      !(target.protocol==="https:"||(target.protocol==="http:"&&["localhost","127.0.0.1"].includes(target.hostname)))) throw new Error("Choose a separate HTTPS or local staging origin.");
  const emails=z.array(z.email()).min(1).max(50).parse(recipients.split(",").map(value=>value.trim().toLowerCase()));
  // Explicit blanks prevent fallback to the live .env for known application settings when loaded later.
  const settings=Object.fromEntries([...template.matchAll(/^([A-Z][A-Z0-9_]*)=/gm)].map(match=>[match[1],""]));
  const copy=["DATABASE_CA_CERT","ORGANISATION_NAME","SMTP_HOST","SMTP_PORT","SMTP_USER","SMTP_PASSWORD","SMTP_FROM",
    "CLINICAL_SMTP_HOST","CLINICAL_SMTP_PORT","CLINICAL_SMTP_USER","CLINICAL_SMTP_PASSWORD","CLINICAL_SMTP_FROM","CLINICAL_RETENTION_DAYS"];
  for(const name of copy) settings[name]=source[name]??"";
  Object.assign(settings,{DATABASE_URL:stagingConnection(source.DATABASE_URL,password),EMCROWN_DATABASE_SCOPE:"staging",
    AUTH_ORIGIN:origin,AUTH_SECRET:randomBytes(32).toString("hex"),SUPER_ADMIN_EMAIL:emails[0],
    CLINICAL_ACTIVE_KEY:"staging-v1",CLINICAL_ENCRYPTION_KEYS:JSON.stringify({"staging-v1":randomBytes(32).toString("hex")}),
    CLINICAL_TOKEN_KEY:randomBytes(32).toString("hex"),CLINICAL_STAFF_EMAIL:emails[0],
    CLINICAL_REVIEW_MODE:"true",CLINICAL_REVIEW_EMAILS:emails.join(","),CLINICAL_BOOKING_ENABLED:"false",
    CLINICAL_INTEGRATIONS_APPROVED:"false",CLINICAL_SMS_ENABLED:"false",CLINICAL_SMS_APPROVED:"false",
    CLINICAL_EMAIL_EVENTS_ENABLED:"false",WORKER_DELIVERY_ENABLED:"false"});
  return settings;
}
function serializeSettings(settings) {
  return "# Private staging configuration. Load explicitly; never commit or share.\n"+Object.entries(settings).map(([name,value])=>{
    // Next expands dollar signs even inside quoted values. Preserve them literally.
    const quote=["'",'"',"`"].find(candidate=>!value.includes(candidate));
    if(!quote||value.includes("\r")||(quote==='"'&&/\\[nr]/.test(value))) throw new Error("A setting needs manual dotenv quoting; nothing was written.");
    return `${name}=${quote}${value.replace(/\$/g,"\\$")}${quote}`;
  }).join("\n")+"\n";
}
function replacePassword(settings,password) {
  const url=new URL(settings.DATABASE_URL);
  if(settings.EMCROWN_DATABASE_SCOPE!=="staging"||decodeURIComponent(url.username).split(".")[0]!=="emcrown_staging_runtime"||!password) throw new Error("Staging settings or password are invalid.");
  url.password=password;
  return {...settings,DATABASE_URL:url.toString()};
}
module.exports={stagingConnection,buildSettings,serializeSettings,replacePassword};
