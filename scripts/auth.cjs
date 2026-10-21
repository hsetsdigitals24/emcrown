// Node-only operations entrypoint: reuse installed TypeScript without another runtime package.
/* eslint-disable @typescript-eslint/no-require-imports -- Standalone server tooling. */
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");
require("@next/env").loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production", { info() {}, error() {} });
const resolve = Module._resolveFilename;
Module._resolveFilename = function (name, ...args) {
  return resolve.call(this, name.startsWith("@/") ? path.resolve("src", name.slice(2)) : name, ...args);
};
require.extensions[".ts"] = (module, filename) => {
  const { outputText } = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  });
  module._compile(outputText, filename);
};
async function main() {
  const command = process.argv[2];
  if (["seed", "migrate"].includes(command) && process.env.DATABASE_MIGRATION_URL) {
    process.env.DATABASE_URL = process.env.DATABASE_MIGRATION_URL;
  }
  if (command === "seed") await require("../src/features/auth/seed.ts").seedOrganisation();
  else if (command === "mail") await require("../src/features/auth/mail.ts").deliverResetEmails();
  else if (command === "migrate") {
    const { drizzle } = require("drizzle-orm/postgres-js");
    const { migrate } = require("drizzle-orm/postgres-js/migrator");
    const postgres = require("postgres");
    const { authEnv } = require("../src/lib/auth-env.ts");
    const { databaseTls } = require("../src/lib/db/tls.ts");
    const env = authEnv();
    if (!process.env.DATABASE_MIGRATION_URL) throw new Error("Migration connection missing");
    const client = postgres(process.env.DATABASE_MIGRATION_URL, { max: 1, prepare: false,
      ssl: databaseTls(env.DATABASE_CA_CERT) });
    try { await migrate(drizzle(client), { migrationsFolder: "drizzle" }); } finally { await client.end(); }
  } else throw new Error("Unknown auth operation");
}
if (require.main === module) main().then(() => { console.log("Auth operation completed."); process.exit(0); })
  .catch(() => { console.error("Auth operation failed. Check configuration and database setup; no credentials were logged."); process.exit(1); });
