// Local artifact builder: reuse lockfile-installed tools; never load .env, call providers or build the Next.js site.
/* eslint-disable @typescript-eslint/no-require-imports -- Standalone Node build tooling. */
const fs = require("node:fs/promises");
const path = require("node:path");
const { createHash } = require("node:crypto");
const esbuild = require("esbuild");
const JSZip = require("jszip");
async function main() {
  const output = path.resolve("artifacts/lambda");
  const lock = JSON.parse(await fs.readFile("package-lock.json", "utf8"));
  for (const name of ["esbuild", "jszip"]) {
    if (require(`${name}/package.json`).version !== lock.packages[`node_modules/${name}`]?.version) throw new Error("Artifact tools do not match package-lock.json.");
  }
  const result = await esbuild.build({ entryPoints: ["src/features/messaging/handler.ts"], outfile: "worker.cjs", write: false,
    bundle: true, platform: "node", target: "node22", format: "cjs", conditions: ["react-server"],
    tsconfig: "tsconfig.json", metafile: true, legalComments: "external", logLevel: "silent" });
  if (Object.keys(result.metafile.inputs).some(name => /node_modules\/next\//.test(name))) throw new Error("Worker unexpectedly includes Next.js request runtime.");
  await fs.mkdir(output, { recursive: true });
  const archive = new JSZip();
  for (const file of result.outputFiles) archive.file(path.basename(file.path), file.contents, { date: new Date("2026-01-01T00:00:00Z") });
  archive.file("bootstrap.cjs", await fs.readFile("infrastructure/lambda/bootstrap.cjs"), { date: new Date("2026-01-01T00:00:00Z") });
  const bytes = await archive.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
  await fs.writeFile(path.join(output, "email-worker.zip"), bytes);
  await fs.writeFile(path.join(output, "worker.cjs"), result.outputFiles.find(file => path.basename(file.path) === "worker.cjs").contents);
  await fs.writeFile(path.join(output, "bundle-inputs.json"), JSON.stringify(Object.keys(result.metafile.inputs), null, 2));
  console.log(`Lambda archive prepared: ${bytes.length} bytes; SHA256 ${createHash("sha256").update(bytes).digest("hex")}`);
}
main().catch(() => { console.error("Worker packaging failed. Check installed lockfile tools and server-only dependency boundaries."); process.exitCode = 1; });
