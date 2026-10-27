// Node render regression: an unavailable preview must never display fallback physician identities.
/* eslint-disable @typescript-eslint/no-require-imports -- Reuse the project loader and installed compiler. */
require("../scripts/auth.cjs");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
require.extensions[".tsx"] = (module, filename) => {
  const { outputText } = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  });
  module._compile(outputText, filename);
};
const Physicians = require("../src/components/home/Physicians.tsx").default;
const { CLINICAL_COPY } = require("../src/config/clinical.ts");
const content = {
  id: "physicians", eyebrow: "Our team", headline: "Meet our physicians", highlightedPhrase: "", body: "",
  physicians: [{ id: "fixture", name: "DO NOT SHOW FALLBACK", specialty: "UNPUBLISHED", photoLabel: "", link: { href: "/physicians/fixture", label: "View profile" } }],
};
const unavailable = renderToStaticMarkup(React.createElement(Physicians, { content, unavailable: true }));
assert.ok(unavailable.includes(CLINICAL_COPY.publicProfilesUnavailable));
assert.ok(unavailable.includes('href="/contact"'));
assert.equal(unavailable.includes("DO NOT SHOW FALLBACK"), false);
assert.equal(unavailable.includes("UNPUBLISHED"), false);
assert.equal(unavailable.includes("/physicians/fixture"), false);
console.log("Unavailable preview renders a useful contact action without fallback physician records.");
