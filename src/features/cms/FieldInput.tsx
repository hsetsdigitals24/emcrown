// Client field: accessible plain-text editing and bounded raster-image replacement.
"use client";
import { useToast } from "@/components/ui/ToastProvider";
import Image from "next/image";
import { useState } from "react";
import { CMS_COPY, CMS_POLICY } from "@/config/cms/copy";
import type { CmsField } from "@/types/cms";
export default function FieldInput({ field, value, onChange }: { field: CmsField; value: string; onChange: (value: string) => void }) {
  const notify = useToast();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function upload(file?: File) {
    if (!file) return;
    if (file.size > CMS_POLICY.maxImageBytes || !["image/jpeg", "image/png", "image/webp"].includes(file.type)) { setError(CMS_COPY.uploadError); return; }
    setBusy(true); setError("");
    try {
      const response = await fetch("/emcrown-admin/cms/media", { method: "POST", body: file, headers: { "Content-Type": file.type } });
      const data: unknown = await response.json();
      if (!response.ok || !data || typeof data !== "object" || !("url" in data) || typeof data.url !== "string") throw new Error("Upload failed");
      onChange(data.url); notify(CMS_COPY.imageSaved, true);
    } catch { setError(CMS_COPY.uploadError); notify(CMS_COPY.uploadError); } finally { setBusy(false); }
  }
  return <div className="cms-field" data-cms-input={field.key}>
    <label><span>{field.label.split(" / ").slice(1).join(" / ") || field.label}</span>
      {field.media || field.link ? <input value={value} onChange={event => onChange(event.target.value)} maxLength={CMS_POLICY.maxText} spellCheck={false} />
        : <textarea value={value} onChange={event => onChange(event.target.value)} rows={value.length > 160 ? 5 : 2} maxLength={CMS_POLICY.maxText} />}
    </label>
    {field.media && <><div className="cms-image-preview"><Image src={value} alt={CMS_COPY.imageAlt} width={280} height={150} unoptimized /></div>
      <label className="cms-upload">{busy ? CMS_COPY.busy : CMS_COPY.upload}<input type="file" accept="image/jpeg,image/png,image/webp" disabled={busy}
        onChange={event => { void upload(event.target.files?.[0]); event.target.value = ""; }} /></label><p>{CMS_COPY.imageHelp}</p></>}
    {error && <p role="alert">{error}</p>}
  </div>;
}
