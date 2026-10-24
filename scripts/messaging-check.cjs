// Operator check: fictional SMS dry run only, never calls the outbox or reserves a visit.
/* eslint-disable @typescript-eslint/no-require-imports */
require("./auth.cjs");
(async () => {
  const { smsEnv } = require("../src/features/clinical/env.ts");
  const env = smsEnv();
  if (env.provider !== "aws") throw new Error("AWS required");
  const { sendAwsSms } = require("../src/features/appointments/aws-sms.ts");
  await sendAwsSms(env, "+12025550101", "Emcrown development configuration check. Fictional recipient; no delivery.", { dryRun: true });
  console.log("AWS SMS dry run passed. No SMS sent; handset delivery and opt-out handling remain untested.");
})().catch(() => { console.error("AWS SMS dry run unavailable. Check approved configuration, IAM and sender setup; no request data was logged."); process.exitCode = 1; });
