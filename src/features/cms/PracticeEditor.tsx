// Client form: a short address editor reuses CMS versions, permissions and publication.
"use client";
import { useState } from "react";
import { PRACTICE_EDITOR as copy, PRACTICE_FIELDS } from "@/config/practice-editor";
import { cmsRequest } from "@/features/cms/client-api";
import { useUnsavedChanges } from "@/features/cms/useUnsavedChanges";
import type { CmsSnapshot } from "@/types/cms";
import PracticeMap from "@/components/ui/PracticeMap";
export default function PracticeEditor({ initial, canPublish }: { initial: CmsSnapshot; canPublish: boolean }) {
  const [saved, setSaved] = useState(initial);
  const [values, setValues] = useState(initial.values);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [message, setMessage] = useState("");
  useUnsavedChanges(JSON.stringify(values) !== JSON.stringify(saved.values));
  async function save(operation: "save" | "publish") {
    if (busy || error) return;
    setBusy(true); setMessage("");
    const result = await cmsRequest("/_site", { path: "/_site", operation, values, version: saved.version });
    setBusy(false);
    if (!result.ok) { setError(true); return; }
    setSaved(result.snapshot); setValues(result.snapshot.values);
    setMessage(operation === "publish" ? copy.published : copy.saved);
  }
  return <section className="clinical-layout"><p>{copy.intro}</p><p>{copy.draftHelp}</p>
    <form className="clinical-panel" onSubmit={event => { event.preventDefault(); void save("save"); }} aria-busy={busy}>
      <fieldset disabled={busy || error}><div className="clinical-fields">{PRACTICE_FIELDS.map(field => {
        const key = `practice.locations.0.${field}`;
        return <label key={field} className="clinical-field">{copy[field]}<input name={field} required={field === "address" || field === "label"} maxLength={500}
          value={values[key] ?? ""} onChange={event => { setMessage(""); setValues(current => ({ ...current, [key]: event.target.value })); }} /></label>;
      })}</div><p>{copy.publishingHelp}</p><div className="clinical-actions"><button type="submit">{busy ? copy.saving : copy.save}</button>
        {canPublish && <button type="button" onClick={event => { if (event.currentTarget.form?.reportValidity()) void save("publish"); }}>{copy.publish}</button>}</div></fieldset>
      {error && <p role="alert" className="clinical-error">{copy.error}</p>}{message && <p role="status">{message}</p>}
    </form><PracticeMap address={values["practice.locations.0.address"] ?? ""} label={values["practice.locations.0.mapLabel"] ?? copy.title} />
  </section>;
}
