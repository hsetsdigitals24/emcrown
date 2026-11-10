// Lambda-only bootstrap: private configuration comes from Lambda's encrypted environment, never event payloads.
/* eslint-disable @typescript-eslint/no-require-imports -- Node.js Lambda entry point. */
function failureCode(error) {
  const codes = ["28P01", "42501", "XX000", "ENOTFOUND", "EAI_AGAIN", "ECONNREFUSED", "ECONNRESET", "CONNECT_TIMEOUT",
    "CERT_HAS_EXPIRED", "SELF_SIGNED_CERT_IN_CHAIN", "UNABLE_TO_VERIFY_LEAF_SIGNATURE", "UNABLE_TO_GET_ISSUER_CERT_LOCALLY", "ERR_TLS_CERT_ALTNAME_INVALID"];
  const messages = new Map([
    ["Staging database permissions are not isolated.", "STAGING_BOUNDARY"],
    ["Email worker database permissions are incomplete.", "WORKER_PRIVILEGES"],
    ["Clinical booking requires the dedicated least-privilege emcrown_staging_runtime database role.", "STAGING_ROLE"],
    ["Clinical booking requires the dedicated least-privilege emcrown_runtime database role.", "LIVE_ROLE"],
  ]);
  // Drizzle wraps driver failures. Report only approved constants from the cause chain.
  let cause = error;
  for (let depth = 0; cause && depth < 5; depth++, cause = cause.cause) {
    if (codes.includes(cause.code)) return cause.code;
    if (messages.has(cause.message)) return messages.get(cause.message);
  }
  return "UNCLASSIFIED";
}
function createHandler({ loadWorker }) {
  return async (event, context) => {
    let stage = "input";
    try {
      if (!event || Object.keys(event).length !== 1 || !["check-configuration", "deliver-email"].includes(event.operation)) throw new Error();
      if (!["true", "false"].includes(process.env.WORKER_DELIVERY_ENABLED)) throw new Error();
      if (event.operation === "deliver-email" && process.env.WORKER_DELIVERY_ENABLED !== "true") return { disabled: true };
      context.callbackWaitsForEmptyEventLoop = false;
      stage = "configuration";
      const scope = process.env.EMCROWN_DATABASE_SCOPE ?? "live";
      if (!["live", "staging"].includes(scope)) throw new Error();
      const environment = { NODE_ENV: process.env.NODE_ENV, WORKER_DELIVERY_ENABLED: process.env.WORKER_DELIVERY_ENABLED,
        EMCROWN_DATABASE_SCOPE: scope, WORKER_SETTINGS_JSON: process.env.WORKER_SETTINGS_JSON };
      // A conservative serialized-size check includes our control keys; AWS validates the final 4 KB quota too.
      if (typeof environment.WORKER_SETTINGS_JSON !== "string" || Buffer.byteLength(JSON.stringify(environment)) > 4096) throw new Error();
      const settings = JSON.parse(environment.WORKER_SETTINGS_JSON);
      const worker = loadWorker();
      worker.configureWorker(settings);
      stage = "processing";
      const result = await worker.runWorker(event, context);
      console.log("Email worker completed", result);
      return result;
    } catch (error) {
      // SDK/database/SMTP exceptions can contain secrets or message details. Never propagate them.
      console.error("Email worker failed", { stage, code: failureCode(error) });
      throw new Error("Email worker failed. Review approved configuration and operational monitoring.");
    }
  };
}
exports.createHandler = createHandler;
exports.handler = createHandler({
  loadWorker: () => require("./worker.cjs"),
});
