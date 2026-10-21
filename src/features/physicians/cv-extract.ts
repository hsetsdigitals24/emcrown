// Client-only CV extraction: local PDF workers and OCR; no file contents leave this device here.
import { CLINICAL_POLICY } from "@/config/clinical";
import { cvType } from "@/features/physicians/cv-validation";
export function extractCv(file: File, signal: AbortSignal, progress: (value: number) => void): Promise<string> {
  return new Promise((resolve, reject) => {
    const cancel = () => reject(new Error("CV extraction cancelled."));
    if (signal.aborted) { cancel(); return; }
    signal.addEventListener("abort", cancel, { once: true });
    // A terminated OCR worker may not settle its job promise; the caller must still unblock.
    extractCvInternal(file, signal, value => { if (!signal.aborted) progress(value); }).then(resolve, reject)
      .finally(() => signal.removeEventListener("abort", cancel));
  });
}
async function extractCvInternal(file: File, signal: AbortSignal, progress: (value: number) => void): Promise<string> {
  const bytes = await file.arrayBuffer(); const type = cvType(new Uint8Array(bytes));
  if (!type || signal.aborted) throw new Error("Unsupported CV.");
  let text: string;
  if (type.includes("wordprocessingml")) {
    text = await extractDocx(bytes, signal);
  } else if (type === "application/pdf") text = await extractPdf(bytes, signal, progress);
  else {
    const image = await createImageBitmap(file);
    try {
      if (image.width * image.height > 20000000) throw new Error("Image too large.");
      const canvas = document.createElement("canvas");
      const scale = Math.min(1, 2000 / Math.max(image.width, image.height));
      canvas.width = Math.round(image.width * scale); canvas.height = Math.round(image.height * scale);
      canvas.getContext("2d")?.drawImage(image, 0, 0, canvas.width, canvas.height);
      text = await recognize(canvas, signal, progress);
    } finally { image.close(); }
  }
  if (signal.aborted || !text.trim() || text.length > CLINICAL_POLICY.cvCharacters) throw new Error("CV extraction unavailable.");
  return text.trim();
}
async function extractPdf(bytes: ArrayBuffer, signal: AbortSignal, progress: (value: number) => void) {
  const pdf = await import("pdfjs-dist"); pdf.GlobalWorkerOptions.workerSrc = "/ocr/pdf.worker.min.mjs";
  const loader = pdf.getDocument({ data: bytes, disableFontFace: true, maxImageSize: 20000000, canvasMaxAreaInBytes: 16000000,
    cMapUrl: "/ocr/cmaps/", cMapPacked: true, standardFontDataUrl: "/ocr/standard_fonts/", wasmUrl: "/ocr/wasm/", useWasm: false });
  const cancel = () => { void loader.destroy(); }; signal.addEventListener("abort", cancel);
  try {
    const doc = await loader.promise;
    if (doc.numPages > CLINICAL_POLICY.cvPages) throw new Error("CV has too many pages.");
    const pages: string[] = [];
    for (let index = 1; index <= doc.numPages; index++) {
      if (signal.aborted) throw new Error("Cancelled.");
      const page = await doc.getPage(index); const content = await page.getTextContent();
      let text = content.items.map(item => "str" in item ? item.str + (item.hasEOL ? "\n" : " ") : "").join("");
      if (text.trim().length < 40) {
        const viewport = page.getViewport({ scale: Math.min(2, 2000 / Math.max(page.getViewport({ scale: 1 }).width, page.getViewport({ scale: 1 }).height)) });
        const canvas = document.createElement("canvas"); canvas.width = Math.ceil(viewport.width); canvas.height = Math.ceil(viewport.height);
        await page.render({ canvas, viewport }).promise;
        text = await recognize(canvas, signal, value => progress(((index - 1) + value) / doc.numPages));
      }
      pages.push(text); progress(index / doc.numPages); page.cleanup();
      if (pages.join("\n").length > CLINICAL_POLICY.cvCharacters) throw new Error("CV text too large.");
    }
    return pages.join("\n\n");
  } finally { signal.removeEventListener("abort", cancel); await loader.destroy(); }
}
async function recognize(image: HTMLCanvasElement, signal: AbortSignal, progress: (value: number) => void) {
  const { createWorker, OEM } = await import("tesseract.js");
  const worker = await createWorker("eng", OEM.LSTM_ONLY, { workerPath: "/ocr/worker.min.js", workerBlobURL: false,
    corePath: "/ocr", langPath: "/ocr", cacheMethod: "none", gzip: true,
    logger: message => { if (message.status === "recognizing text") progress(message.progress); }, errorHandler: () => undefined });
  const cancel = () => { void worker.terminate(); }; signal.addEventListener("abort", cancel);
  try {
    if (signal.aborted) throw new Error("Cancelled.");
    return (await worker.recognize(image)).data.text;
  } finally { signal.removeEventListener("abort", cancel); await worker.terminate(); }
}

function extractDocx(bytes: ArrayBuffer, signal: AbortSignal): Promise<string> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL("./docx.worker.ts", import.meta.url), { type: "module" });
    const cleanup = () => { worker.terminate(); signal.removeEventListener("abort", cancel); };
    const cancel = () => { cleanup(); reject(new Error("Cancelled.")); };
    signal.addEventListener("abort", cancel);
    worker.onmessage = (event: MessageEvent<unknown>) => {
      cleanup(); const data = event.data;
      if (data && typeof data === "object" && "text" in data && typeof data.text === "string") resolve(data.text);
      else reject(new Error("DOCX unavailable."));
    };
    worker.onerror = () => { cleanup(); reject(new Error("DOCX unavailable.")); };
    if (signal.aborted) cancel(); else worker.postMessage(bytes, [bytes]);
  });
}
