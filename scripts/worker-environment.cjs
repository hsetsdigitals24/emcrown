// Node-only local size estimate: inspect configured names privately and print counts, never values or an export file.
/* eslint-disable @typescript-eslint/no-require-imports -- Standalone operational tooling. */
require("@next/env").loadEnvConfig(process.cwd(), true, { info() {}, error() {} });
const names = Object.keys(require("../infrastructure/lambda/settings.example.json"));
const settings = Object.fromEntries(names.filter(name => process.env[name] !== undefined).map(name => [name, process.env[name]]));
const variables = { NODE_ENV: "production", WORKER_DELIVERY_ENABLED: "false", EMCROWN_DATABASE_SCOPE: process.env.EMCROWN_DATABASE_SCOPE ?? "live", WORKER_SETTINGS_JSON: JSON.stringify(settings) };
const bytes = Buffer.byteLength(JSON.stringify(variables));
console.log(`Local worker settings present: ${Object.keys(settings).length}/${names.length}.`);
console.log(`Conservative serialized environment size: ${bytes}/4096 bytes.`);
console.log("Size estimate only: this does not verify staging isolation, permissions, HTTPS origin or delivery readiness.");
if (bytes > 4096 || variables.WORKER_SETTINGS_JSON.length > 3900) {
  console.error("Settings exceed the prepared deployment limit. Review configuration without removing TLS or encryption safeguards.");
  process.exitCode = 1;
}
