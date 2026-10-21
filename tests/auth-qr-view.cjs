// Node-only server-rendered UI check: the QR remains inline and the manual key stays accessible.
/* eslint-disable @typescript-eslint/no-require-imports -- Existing TypeScript test tooling. */
require("../scripts/auth.cjs");
const fs = require("node:fs");
const ts = require("typescript");
require.extensions[".tsx"] = (module, filename) => {
  const { outputText } = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  });
  module._compile(outputText, filename);
};
const assert = require("node:assert/strict");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const MfaEnrollment = require("../src/features/auth/MfaEnrollment.tsx").default;
const QRCode = require("qrcode");
async function main() {
  const setupKey = "TEST-ONLY-SETUP-KEY";
  const qrDataUrl = await QRCode.toDataURL("test-only");
  const qr = renderToStaticMarkup(React.createElement(MfaEnrollment, { setupKey, qrDataUrl }));
  assert.match(qr, /src="data:image\/png;base64,/);
  assert.doesNotMatch(qr, /_next\/image|https?:\/\//);
  assert.match(qr, /<details><summary/);
  assert.match(qr, /TEST-ONLY-SETUP-KEY/);
  const manual = renderToStaticMarkup(React.createElement(MfaEnrollment, { setupKey }));
  assert.match(manual, /TEST-ONLY-SETUP-KEY/);
  assert.doesNotMatch(manual, /<img|<details/);
  console.log("Passed: private inline QR, accessible manual fallback and no external/image-cache URL.");
}
main().catch(error => { console.error(error); process.exitCode = 1; });
