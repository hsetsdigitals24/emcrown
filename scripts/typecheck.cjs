// Node-only check: use the compiler API because this environment's tsc wrapper is unreliable.
/* eslint-disable @typescript-eslint/no-require-imports -- Standalone tooling. */
const ts = require("typescript");
const config = ts.readConfigFile("tsconfig.json", ts.sys.readFile);
const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, process.cwd());
const program = ts.createProgram(parsed.fileNames, { ...parsed.options, incremental: false, noEmit: true });
const diagnostics = [...parsed.errors, ...ts.getPreEmitDiagnostics(program)];
if (diagnostics.length) {
  console.error(ts.formatDiagnosticsWithColorAndContext(diagnostics, {
    getCanonicalFileName: file => file, getCurrentDirectory: ts.sys.getCurrentDirectory, getNewLine: () => "\n",
  }));
  process.exitCode = 1;
} else console.log("TypeScript passed.");
