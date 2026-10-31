// Client list actions: native confirmation dialog keeps lifecycle changes explicit.
"use client";
import { useId, useRef, useState } from "react";
import { z } from "zod";
import type { Physician } from "@/types/clinical";
import { CLINICAL_COPY as c } from "@/config/clinical";
import { PHYSICIAN_FORM as copy } from "@/config/clinical-form";
import { physicianSchema } from "@/features/clinical/validation";
import { clinicalRequest } from "@/features/clinical/client";
import { useToast } from "@/components/ui/ToastProvider";
import type { PhysicianOperation } from "@/features/physicians/lifecycle";
import { physicianName } from "@/lib/physician-name";

export default function PhysicianSettings({ physician, onChanged }: { physician: Physician; onChanged: () => Promise<void> }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId(); const descriptionId = useId();
  const [operation, setOperation] = useState<PhysicianOperation>("unpublish");
  const [busy, setBusy] = useState(false);
  const notify = useToast();
  const label = operation === "unpublish" ? c.unpublish : operation === "publish" ? copy.show : operation === "pause" ? c.archive : copy.resume;
  const description = operation === "unpublish" ? copy.withdrawHelp : operation === "publish" ? copy.showHelp : operation === "pause" ? copy.pauseHelp : copy.resumeHelp;
  const effect = operation === "publish" ? physician.active ? copy.visibleBooking : copy.visiblePaused : operation === "resume" ? physician.published ? copy.visibleBooking : copy.hiddenBooking : "";
  const buttonClass = operation === "unpublish" ? "physician-withdraw" : operation === "pause" ? "physician-archive" : "";
  function confirm(action: PhysicianOperation) {
    setOperation(action); dialog.current?.showModal();
  }
  async function apply() {
    if (busy) return;
    setBusy(true);
    try {
      const result = await clinicalRequest("/emcrown-admin/physicians/api", z.object({ id: z.uuid() }), {
        id: physician.id, version: physician.version, profile: physicianSchema.strip().parse(physician), operation,
      });
      if (!result.ok) { notify(result.code === "conflict" ? c.conflict : c.error); return; }
      dialog.current?.close();
      notify(copy.changed, true);
      await onChanged();
    } finally { setBusy(false); }
  }
  return <details className="physician-disclosure physician-list-settings"><summary>{copy.settings}</summary>
    <p>{copy.visibility}: {physician.published ? copy.visible : copy.hidden}</p>
    <div className="clinical-actions"><button data-intent={physician.published ? "danger" : "success"} type="button" className={physician.published ? "physician-withdraw" : ""} onClick={() => confirm(physician.published ? "unpublish" : "publish")}>{physician.published ? c.unpublish : copy.show}</button></div>
    <p>{copy.booking}: {physician.active ? copy.accepting : copy.paused}</p>
    <div className="clinical-actions"><button data-intent={physician.active ? "caution" : "success"} type="button" className={physician.active ? "physician-archive" : ""} onClick={() => confirm(physician.active ? "pause" : "resume")}>{physician.active ? c.archive : copy.resume}</button></div>
    <dialog ref={dialog} className="physician-confirm clinical-panel" aria-labelledby={titleId} aria-describedby={descriptionId}
      onCancel={event => { if (busy) event.preventDefault(); }}>
      <h2 id={titleId}>{label}: {physicianName(physician)}?</h2>
      <p id={descriptionId}>{description}{effect && <> {effect}</>}</p>
      <div className="clinical-actions">
        <button data-intent="secondary" autoFocus type="button" className="clinical-secondary" disabled={busy} onClick={() => dialog.current?.close()}>{c.cancel}</button>
        <button data-intent={operation === "unpublish" ? "danger" : operation === "pause" ? "caution" : "success"} type="button" className={buttonClass} disabled={busy} onClick={() => void apply()}>{busy ? c.working : label}</button>
      </div>
    </dialog>
  </details>;
}
