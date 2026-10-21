// Node asset preparation: serve OCR code/model locally; document contents never go to a CDN.
/* eslint-disable @typescript-eslint/no-require-imports -- Standalone setup script. */
const fs = require("node:fs/promises");
const path = require("node:path");
const { createHash } = require("node:crypto");
async function main() {
  const directory = "public/ocr"; await fs.mkdir(directory, { recursive: true });
  await fs.copyFile("node_modules/tesseract.js/dist/worker.min.js", `${directory}/worker.min.js`);
  const files = await fs.readdir("node_modules/tesseract.js-core");
  for (const file of files.filter(name => /-lstm\.wasm(?:\.js)?$/.test(name))) await fs.copyFile(path.join("node_modules/tesseract.js-core", file), path.join(directory, file));
  await fs.copyFile("node_modules/pdfjs-dist/build/pdf.worker.min.mjs", `${directory}/pdf.worker.min.mjs`);
  for (const folder of ["wasm", "cmaps", "standard_fonts"]) await fs.cp(`node_modules/pdfjs-dist/${folder}`, `${directory}/${folder}`, { recursive: true });
  const model = `${directory}/eng.traineddata.gz`;
  try { await fs.access(model); } catch {
    const response = await fetch("https://cdn.jsdelivr.net/npm/@tesseract.js-data/eng@1.0.0/4.0.0_best_int/eng.traineddata.gz", { signal: AbortSignal.timeout(60000) });
    if (!response.ok) throw new Error("English OCR model download failed.");
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length > 20 * 1024 * 1024) throw new Error("Unexpected model size.");
    await fs.writeFile(model, bytes);
  }
  const hash = createHash("sha256").update(await fs.readFile(model)).digest("hex");
  if (hash !== "45b4cb346724ac1774f1c36f42f182b887bcdb28ebe63e6fff90ac41f3fcff91") throw new Error("OCR model checksum mismatch.");
  console.log(`CV assets prepared. English model SHA-256: ${hash}`);
}
main().catch(() => { console.error("CV assets could not be prepared. Check installed packages and network access."); process.exitCode = 1; });
