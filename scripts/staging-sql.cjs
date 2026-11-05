// Node-only staging bootstrap preparation: transform reviewed repository SQL, never connect or load environment secrets.
/* eslint-disable @typescript-eslint/no-require-imports -- Standalone migration artifact tooling. */
const fs = require("node:fs");
const path = require("node:path");
const { createHash } = require("node:crypto");
function stagingSql() {
  const journal = JSON.parse(fs.readFileSync("drizzle/meta/_journal.json", "utf8"));
  const rewrite = text => text.replace(/\bemcrown_admin\b/g, "emcrown_staging").replace(/\bemcrown_runtime\b/g, "emcrown_staging_runtime");
  const migrations = journal.entries.map(entry => {
    const source = fs.readFileSync(path.join("drizzle", `${entry.tag}.sql`), "utf8");
    // The shared extension must already be present; staging bootstrap must not change shared extension setup.
    const body = rewrite(source).replace(/CREATE EXTENSION IF NOT EXISTS btree_gist;/g, "");
    if (/\bemcrown_admin\b|\bemcrown_runtime\b/.test(body)) throw new Error("Staging SQL has a live reference.");
    const hash = createHash("sha256").update(source).digest("hex");
    return `${body}\nINSERT INTO emcrown_staging.__staging_migrations (tag, source_hash) VALUES ('${entry.tag}', '${hash}');`;
  });
  // Names are fixed repository constants, not user-provided identifiers or database records.
  return `-- Reviewed fresh-schema bootstrap only. No passwords or production data are included.
BEGIN;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'emcrown_staging')
    OR EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'emcrown_staging_runtime') THEN
    RAISE EXCEPTION 'Staging schema or role already exists; stop and review rather than overwrite';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'btree_gist') THEN
    RAISE EXCEPTION 'Shared btree_gist extension is missing; review separately';
  END IF;
END $$;
CREATE ROLE emcrown_staging_runtime NOLOGIN NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS;
CREATE SCHEMA emcrown_staging;
CREATE TABLE emcrown_staging.__staging_migrations (tag text PRIMARY KEY, source_hash text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now());
${migrations.join("\n")}\n${rewrite(fs.readFileSync("infrastructure/database/runtime-grants.sql", "utf8"))}
REVOKE ALL ON SCHEMA emcrown_staging FROM PUBLIC;
-- Metadata checks do not read live rows or modify any existing live privileges.
DO $$ BEGIN
  IF has_schema_privilege('emcrown_staging_runtime', 'emcrown_admin', 'USAGE')
    OR has_schema_privilege('emcrown_staging_runtime', 'public', 'CREATE')
    OR has_schema_privilege('emcrown_runtime', 'emcrown_staging', 'USAGE') THEN
    RAISE EXCEPTION 'Inherited/public privileges defeat staging isolation; rollback and review';
  END IF;
END $$;
COMMIT;
-- Login is deliberately disabled. Set a strong private password and enable LOGIN only after review.
`;
}
module.exports = { stagingSql };
if (require.main === module) {
  try {
    const output = path.resolve("artifacts/staging/staging-bootstrap.sql");
    fs.mkdirSync(path.dirname(output), { recursive: true });fs.writeFileSync(output, stagingSql());
    console.log("Prepared artifacts/staging/staging-bootstrap.sql. No database connection or changes made.");
  } catch { console.error("Staging SQL preparation failed; no database connection was made.");process.exitCode = 1; }
}
