// Lambda-only bootstrap: private configuration comes from Lambda's encrypted environment, never event payloads.
/* eslint-disable @typescript-eslint/no-require-imports -- Node.js Lambda entry point. */
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
    } catch {
      // SDK/database/SMTP exceptions can contain secrets or message details. Never propagate them.
      console.error("Email worker failed", { stage });
      throw new Error("Email worker failed. Review approved configuration and operational monitoring.");
    }
  };
}
exports.createHandler = createHandler;
exports.handler = createHandler({
  loadWorker: () => require("./worker.cjs"),
});
