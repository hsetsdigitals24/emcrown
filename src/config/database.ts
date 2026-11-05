// Server/migration configuration: only two fixed namespaces are allowed; live stays the default.
const scope = process.env.EMCROWN_DATABASE_SCOPE ?? "live";
if (scope !== "live" && scope !== "staging") throw new Error("Database scope is invalid.");
export const DATABASE_SCOPE = scope;
export const DATABASE_SCHEMA = scope === "staging" ? "emcrown_staging" : "emcrown_admin";
export const DATABASE_RUNTIME_ROLE = scope === "staging" ? "emcrown_staging_runtime" : "emcrown_runtime";
