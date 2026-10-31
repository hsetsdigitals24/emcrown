// Node rendering regression: fictional profiles verify public booking cues and reversible admin controls.
/* eslint-disable @typescript-eslint/no-require-imports -- Reuse installed TypeScript and React without test dependencies. */
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
const { PublicPhysicianDetail } = require("../src/features/physicians/PublicPhysicians.tsx");
const Settings = require("../src/features/physicians/PhysicianSettings.tsx").default;
const Form = require("../src/features/physicians/PhysicianForm.tsx").default;
const { PHYSICIAN_FORM: copy } = require("../src/config/clinical-form.ts");
const fixture = { id:"00000000-0000-4000-8000-000000000001", version:1, published:true,
  fullName:"Fictional Physician", title:"[TEST TITLE]", email:"fictional@example.test", phone:"",
  bio:"Fictional biography", credentials:"", specialties:"", languages:"", photo:"",
  slug:"fictional-physician", active:true, notifyAppointments:false };
for (const active of [true, false]) {
  const markup = renderToStaticMarkup(React.createElement(PublicPhysicianDetail, {record:{...fixture, bookingAvailable:active}}));
  assert.match(markup, /Fictional biography/);
  if (active) assert.match(markup, /href="\/book\?physician=fictional-physician"/);
  else {
    assert.doesNotMatch(markup, /href="\/book\?physician=/);
    assert.match(markup, /Online booking is currently unavailable/);
  }
  for (const published of [true, false]) {
    const settings = renderToStaticMarkup(React.createElement(Settings, {physician:{...fixture, active, published}, onChanged:async()=>{}}));
    assert.match(settings, new RegExp(published ? "Hide from website" : "Show on website"));
    assert.match(settings, new RegExp(active ? "Pause online booking" : "Resume online booking"));
    assert.doesNotMatch(settings, /Withdraw profile|Archive physician/);
    assert.match(settings, /<dialog[^>]+aria-labelledby=/);
    assert.match(settings, /<summary>Profile settings<\/summary>/);
  }
}
const unchanged = renderToStaticMarkup(React.createElement(Form, {physician:fixture, onSaved:async()=>{}, onBack:()=>{}}));
assert.doesNotMatch(unchanged, /<button[^>]+type="submit"/);
assert.match(unchanged, /No unsaved changes/);
assert.doesNotMatch(unchanged, /Hide from website|Pause online booking/);
const fresh = renderToStaticMarkup(React.createElement(Form, {onSaved:async()=>{}, onBack:()=>{}}));
assert.match(fresh, /<button[^>]+type="submit">Save record/);
for (const text of [copy.pauseHelp, copy.withdrawHelp, copy.resumeHelp, copy.showHelp]) {
  assert.match(text, /undo this/);
  assert.match(text, /kept|unchanged|stay private/);
}
console.log("Physician rendering checks passed: public paused profiles, booking links, all four reversible control states, confirmations and unchanged-record Save visibility.");
