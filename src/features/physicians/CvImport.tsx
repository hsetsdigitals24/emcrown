// Client CV import: lazy extraction, explicit review and cancellation; raw files stay in tab memory.
"use client";
import { useEffect, useRef, useState } from "react";
import { CLINICAL_COPY as c, CLINICAL_POLICY } from "@/config/clinical";
import { useToast } from "@/components/ui/ToastProvider";
export default function CvImport({ onReviewed }: { onReviewed: (file: File, text: string) => void }) {
  const [file, setFile] = useState<File>(); const [text, setText] = useState("");
  const [busy, setBusy] = useState(false); const [progress, setProgress] = useState(0);
  const controller = useRef<AbortController | null>(null); const notify = useToast();
  useEffect(() => () => controller.current?.abort(), []);
  async function read(value?: File) {
    if (!value || busy) return;
    if (value.size > CLINICAL_POLICY.cvBytes) { notify(c.cvError); return; }
    setBusy(true); setText(""); setFile(undefined); setProgress(0);
    const abort = new AbortController(); controller.current = abort;
    const timeout = window.setTimeout(() => abort.abort(), CLINICAL_POLICY.cvTimeoutMs);
    try {
      const { extractCv } = await import("@/features/physicians/cv-extract");
      const extracted = await extractCv(value, abort.signal, setProgress);
      if (!abort.signal.aborted) { setText(extracted); setFile(value); notify(c.extracted, true); }
    } catch { notify(c.cvError); } finally { window.clearTimeout(timeout); setBusy(false); }
  }
  return <section className="clinical-panel"><h2>{c.cv}</h2><p>{c.cvHelp}</p>
    <label className="clinical-field">{c.cv}<input type="file" disabled={busy} accept=".pdf,.docx,.png,.jpg,.jpeg"
      onChange={event => { void read(event.target.files?.[0]); event.target.value = ""; }} /></label>
    {busy && <div role="status">{c.extracting} {Math.round(progress * 100)}% <button data-intent="secondary" type="button" onClick={() => controller.current?.abort()}>{c.cancel}</button></div>}
    {file && <><label className="clinical-field">{c.reviewCv}<textarea rows={10} value={text} maxLength={CLINICAL_POLICY.cvCharacters} onChange={event => setText(event.target.value)} /></label>
      <p>{c.extractionNote}</p><button data-intent="success" type="button" className="clinical-button" onClick={() => { onReviewed(file, text); setFile(undefined); setText(""); }}>{c.applyCv}</button></>}
  </section>;
}
