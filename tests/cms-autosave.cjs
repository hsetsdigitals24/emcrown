// Client hook integration: debounce, pending edits, offline recovery and conflict pauses.
/* eslint-disable @typescript-eslint/no-require-imports -- Existing TypeScript loader plus JSX support. */
require("../scripts/auth.cjs");
const fs = require("node:fs");
const ts = require("typescript");
require.extensions[".tsx"] = (module, filename) => {
  module._compile(ts.transpileModule(fs.readFileSync(filename, "utf8"), { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true,
  } }).outputText, filename);
};
const assert = require("node:assert/strict");
(async () => {
  const { Window } = await import("happy-dom");
  const window = new Window();
  Object.assign(global, { window, document: window.document, HTMLElement: window.HTMLElement, IS_REACT_ACT_ENVIRONMENT: true });
  Object.defineProperty(global, "navigator", { value: window.navigator, configurable: true });
  let online = true;
  Object.defineProperty(window.navigator, "onLine", { get: () => online });
  const React = require("react");
  const { act } = React;
  const { createRoot } = require("react-dom/client");
  const { CMS_POLICY } = require("../src/config/cms/copy.ts");
  CMS_POLICY.autosaveDelay = 30; CMS_POLICY.autosaveRetry = 50;
  const { useAutosave } = require("../src/features/cms/useAutosave.ts");
  const Provider = require("../src/components/ui/ToastProvider.tsx").default;
  const calls = [];
  function Harness(props) { useAutosave({ ...props, save: async () => { calls.push(props.content); } }); return null; }
  const root = createRoot(window.document.body.appendChild(window.document.createElement("div")));
  const state = { content: "starter", dirty: false, busy: false, blocked: false, retry: false };
  const render = async patch => { Object.assign(state, patch); await act(async () => root.render(React.createElement(Provider, null, React.createElement(Harness, state)))); };
  const wait = async ms => { await act(async () => new Promise(resolve => setTimeout(resolve, ms))); };
  await render({}); await wait(45); assert.equal(calls.length, 0, "No save on initial load");
  await render({ dirty: true, content: "first" }); await wait(10);
  await render({ content: "second" }); await wait(45); assert.deepEqual(calls, ["second"], "Typing is debounced");
  await render({ busy: true, content: "third" }); await wait(45); assert.equal(calls.length, 1, "Manual actions and pending saves serialize autosave");
  await render({ busy: false }); await wait(45); assert.equal(calls.at(-1), "third", "Edits made during save are queued");
  await render({ blocked: true, content: "conflict" }); await wait(45); assert.equal(calls.length, 2, "Conflict never overwrites newer server state");
  online = false; await act(async () => window.dispatchEvent(new window.Event("offline")));
  await render({ blocked: false, content: "offline" }); await wait(45); assert.equal(calls.length, 2);
  assert.ok(window.document.body.textContent.includes("Offline."));
  await act(async () => window.document.querySelector(".toast-stack button").click());
  assert.equal(window.document.querySelector(".toast-stack .admin-toast"), null, "Toast can be dismissed");
  online = true; await act(async () => window.dispatchEvent(new window.Event("online")));
  await wait(45); assert.equal(calls.at(-1), "offline", "Reconnect retries current draft");
  await render({ retry: true, content: "retry" }); await wait(35); assert.equal(calls.length, 3);
  await wait(35); assert.equal(calls.at(-1), "retry", "Transient failures use retry delay");
  await render({ content: "unmounted" }); await act(async () => root.unmount()); await wait(60);
  assert.equal(calls.length, 4, "Unmount cancels scheduled saves");
  await window.happyDOM.close();
  console.log("CMS autosave passed: debounce, clean load, in-flight edits, conflicts, offline/reconnect, retry and unmount.");
})().catch(error => { console.error(error); process.exitCode = 1; });
