// Client controls: native device presets, a touch-friendly width slider and precise numeric entry.
"use client";
import { useState } from "react";
import { CMS_COPY } from "@/config/cms/copy";
import { PREVIEW_WIDTH, clampPreviewWidth } from "@/config/cms/viewport";
export default function PreviewControls({ width, available, scale, onChange }: {
  width: number | null; available: number; scale: number; onChange: (width: number | null) => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const actualWidth = width ?? Math.max(PREVIEW_WIDTH.min, Math.floor(available));
  const presets = [{ label: CMS_COPY.responsive, value: null }, { label: CMS_COPY.mobile, value: PREVIEW_WIDTH.mobile },
    { label: CMS_COPY.tablet, value: PREVIEW_WIDTH.tablet }, { label: CMS_COPY.desktop, value: PREVIEW_WIDTH.desktop }];
  function commit() {
    if (draft !== null && draft.trim()) onChange(clampPreviewWidth(Number(draft)));
    setDraft(null);
  }
  return <div className="cms-viewport-controls">
    <div className="cms-device-presets" role="group" aria-label={CMS_COPY.devices}>{presets.map(preset => <button key={preset.label} type="button"
      aria-pressed={width === preset.value} onClick={() => onChange(preset.value)}>{preset.label}</button>)}</div>
    <div className="cms-width-controls"><label>{CMS_COPY.width}<input type="number" inputMode="numeric" min={PREVIEW_WIDTH.min} max={PREVIEW_WIDTH.max}
      step={1} value={draft ?? actualWidth} onChange={event => setDraft(event.target.value)} onBlur={commit}
      onKeyDown={event => { if (event.key === "Enter") event.currentTarget.blur(); if (event.key === "Escape") setDraft(null); }} /></label>
      <input type="range" aria-label={CMS_COPY.resize} min={PREVIEW_WIDTH.min} max={PREVIEW_WIDTH.max} step={1}
        value={clampPreviewWidth(actualWidth)} onChange={event => onChange(Number(event.target.value))} />
      <output aria-label={CMS_COPY.scaled}>{Math.round(scale * 100)}%</output>
    </div>
  </div>;
}
