// Browser worker: bounded DOCX raw-text conversion stays off the editor's main thread.
import mammoth from "mammoth/mammoth.browser";
const scope = globalThis as unknown as { onmessage: ((event: MessageEvent<ArrayBuffer>) => void) | null; postMessage: (data: unknown) => void };
scope.onmessage = async event => {
  try { scope.postMessage({ ok: true, text: (await mammoth.extractRawText({ arrayBuffer: event.data })).value }); }
  catch { scope.postMessage({ ok: false }); }
};
