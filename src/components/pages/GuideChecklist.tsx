// Client island: an ephemeral preparation checklist; no storage, requests or patient input.
"use client";
import { useState } from "react";
export default function GuideChecklist({ items, completedLabel, resetLabel }: { items: string[]; completedLabel: string; resetLabel: string }) {
  const [checked, setChecked] = useState<number[]>([]);
  return <div className="guide-checklist">
    <div className="guide-check-status"><span role="status">{checked.length} / {items.length} {completedLabel}</span><button type="button" onClick={() => setChecked([])} disabled={!checked.length}>{resetLabel}</button></div>
    <progress value={checked.length} max={items.length} aria-label={completedLabel} />
    {items.map((item, index) => <label key={index} className="guide-check-item"><input type="checkbox" checked={checked.includes(index)} onChange={(event) => {
      const isChecked = event.currentTarget.checked;
      setChecked(previous => isChecked ? [...previous, index] : previous.filter(value => value !== index));
    }} /><span>{item}</span></label>)}
  </div>;
}
