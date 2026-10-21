// Client photo picker: reuse authenticated image uploads or store a validated image link.
"use client";
import Image from "next/image";
import { useState } from "react";
import { PHYSICIAN_FORM as copy } from "@/config/clinical-form";
import { CMS_POLICY } from "@/config/cms/copy";
import { useToast } from "@/components/ui/ToastProvider";
export default function PhotoInput({ value, onChange, onBusy }: { value: string; onChange: (value: string) => void; onBusy: (busy: boolean) => void }) {
  const [mode, setMode] = useState<"upload" | "link">(value.startsWith("https:") ? "link" : "upload");
  const [busy, setBusy] = useState(false); const [error, setError] = useState(""); const [failed, setFailed] = useState("");
  const notify = useToast();
  async function upload(file?: File) {
    if (!file) return;
    if (file.size > CMS_POLICY.maxImageBytes || !["image/jpeg", "image/png", "image/webp"].includes(file.type)) { setError(copy.photoHelp); return; }
    setBusy(true); onBusy(true); setError("");
    try {
      const response = await fetch("/emcrown-admin/cms/media", { method: "POST", body: file, headers: { "Content-Type": file.type } });
      const data: unknown = await response.json();
      if (!response.ok || !data || typeof data !== "object" || !("url" in data) || typeof data.url !== "string") throw new Error();
      onChange(data.url); notify(copy.uploadDone, true);
    } catch { setError(copy.uploadError); notify(copy.uploadError); }
    finally { setBusy(false); onBusy(false); }
  }
  // Remount mode-specific inputs: file inputs must stay uncontrolled for their lifetime.
  const preview = /^\/media\/[\w/.-]+$/.test(value) || /^https:\/\/[^\s]+$/.test(value);
  return <div className="physician-photo"><div className="physician-photo-preview">
    {preview && failed !== value ? <Image src={value} alt={copy.photoAlt} width={144} height={144} unoptimized referrerPolicy="no-referrer" onError={() => setFailed(value)} /> : <span>{copy.photoEmpty}</span>}
  </div><div className="physician-photo-controls"><h4>{copy.photo}</h4><div className="clinical-segments" role="group" aria-label={copy.photo}>
    {(["upload", "link"] as const).map(option => <button type="button" key={option} aria-pressed={mode === option} disabled={busy} onClick={() => setMode(option)}>{copy[option]}</button>)}
  </div>{mode === "upload" ? <label className="clinical-field"><span>{copy.upload}</span><input key="photo-upload" type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={event => { void upload(event.target.files?.[0]); event.target.value = ""; }} /><small>{copy.photoHelp}</small></label>
    : <label className="clinical-field"><span>{copy.link}</span><input key="photo-link" type="text" value={value} placeholder={copy.placeholders.photo} maxLength={2048} spellCheck={false} onChange={event => onChange(event.target.value.trim())} /><small>{copy.linkHelp}</small></label>}
    {value && <button className="clinical-text-button" type="button" disabled={busy} onClick={() => { onChange(""); setError(""); }}>{copy.remove}</button>}
    {busy && <p role="status">{copy.uploading}</p>}{(error || (value && failed === value)) && <p className="clinical-error" role="alert">{error || copy.imageError}</p>}
  </div></div>;
}
