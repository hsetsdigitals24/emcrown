// Client private record editor: explicit saves/publication and reviewed CV suggestions.
"use client";
import { useState } from "react";
import { z } from "zod";
import { CLINICAL_COPY as c } from "@/config/clinical";
import type { Physician, PhysicianProfile } from "@/types/clinical";
import { physicianSchema } from "@/features/clinical/validation";
import { clinicalRequest } from "@/features/clinical/client";
import { cvSuggestions } from "@/features/physicians/cv-suggestions";
import { PHYSICIAN_FORM as copy } from "@/config/clinical-form";
import ProfileFields from "@/features/physicians/ProfileFields";
import CvImport from "@/features/physicians/CvImport";
import { useUnsavedChanges } from "@/features/cms/useUnsavedChanges";
import { useToast } from "@/components/ui/ToastProvider";
const EMPTY: PhysicianProfile = { fullName: "", title: "", email: "", phone: "", bio: "", credentials: "", specialties: "", languages: "", photo: "", slug: "", active: true, notifyAppointments: false };
export default function PhysicianForm({ physician, onSaved, onBack }: { physician?: Physician; onSaved: (id: string) => Promise<void>; onBack: () => void }) {
  const [profile, setProfile] = useState<PhysicianProfile>(physician ? physicianSchema.parse(physicianSchema.strip().parse(physician)) : EMPTY);
  const [pendingCv, setPendingCv] = useState<{ file: File; text: string }>(); const [busy, setBusy] = useState(false);
  const notify = useToast();
  const [photoBusy, setPhotoBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [identity, setIdentity] = useState({ id: physician?.id, version: physician?.version ?? 0 });
  const dirty = Boolean(pendingCv) || JSON.stringify(profile) !== JSON.stringify(physician ? physicianSchema.strip().parse(physician) : EMPTY);
  useUnsavedChanges(dirty);
  function update(key: keyof PhysicianProfile, value: string | boolean) { setProfile(current => ({ ...current, [key]: value })); }
  async function save(operation: "save" | "publish") {
    if (busy || photoBusy || (operation === "save" && physician && !dirty)) return;
    if (profile.notifyAppointments && !profile.email) {
      setErrors({ email: copy.alertEmailRequired }); notify(copy.invalid);
      requestAnimationFrame(() => {
        const field = document.getElementById("physician-email");
        const section = field?.closest("details"); if (section) section.open = true;
        field?.focus();
      }); return;
    }
    const parsed = physicianSchema.safeParse(profile);
    if (!parsed.success) {
      const fields: Record<string, string> = {};
      for (const issue of parsed.error.issues) { const key = String(issue.path[0]); fields[key] = key === "slug" ? copy.slugError : key === "fullName" ? copy.nameError : copy.fieldError; }
      setErrors(fields); notify(copy.invalid);
      requestAnimationFrame(() => {
        const field = document.querySelector<HTMLElement>('[aria-invalid="true"]');
        const section = field?.closest("details"); if (section) section.open = true;
        field?.focus();
      }); return;
    }
    setErrors({});
    setBusy(true);
    try {
      const result = await clinicalRequest("/emcrown-admin/physicians/api", z.object({ id: z.uuid() }), { id: identity.id, version: identity.version, profile, operation });
      if (!result.ok) { notify(result.code === "conflict" ? c.conflict : c.error); return; }
      setIdentity({ id: result.data.id, version: identity.version + 1 });
      if (pendingCv) {
        const form = new FormData(); form.set("physicianId", result.data.id); form.set("file", pendingCv.file); form.set("text", pendingCv.text);
        try {
          const response = await fetch("/emcrown-admin/physicians/documents", { method: "POST", body: form });
          if (!response.ok) throw new Error("CV unavailable.");
          setPendingCv(undefined);
        } catch { notify(c.cvStoreError); return; }
      }
      notify(c.saved, true); await onSaved(result.data.id);
    } finally { setBusy(false); }
  }
  return <div className="clinical-layout"><form className="clinical-panel physician-editor" noValidate onSubmit={event => { event.preventDefault(); void save("save"); }}>
    <header className="clinical-form-header"><h2>{physician ? c.edit : c.create}</h2><p>{copy.intro}</p></header>
    <fieldset disabled={busy || photoBusy}>
    <ProfileFields profile={profile} errors={errors} update={update} onPhotoBusy={setPhotoBusy} />
    <p className="clinical-save-help">{copy.saveHelp}</p>
    {physician && !dirty && <p role="status">{copy.unchanged}</p>}
    <div className="clinical-actions clinical-form-actions">{(!physician || dirty) && <button data-intent="primary" type="submit">{busy ? c.working : c.save}</button>}
      <button data-intent="secondary" className="clinical-secondary" type="button" onClick={() => { if (!dirty || window.confirm(c.leave)) onBack(); }}>{c.back}</button></div>
    <details className="physician-disclosure"><summary>{copy.publication}</summary><p>{copy.saveHelp}</p>
      <div className="clinical-actions"><button data-intent="success" className="clinical-secondary" type="button" onClick={() => void save("publish")}>{c.publish}</button></div>
    </details>
    {pendingCv && <p role="status">{c.cvPending}</p>}
    {physician?.documentId && <a data-intent="secondary" className="clinical-button" href={`/emcrown-admin/physicians/documents/${physician.documentId}`}>{c.downloadCv}</a>}
    </fieldset></form><details className="clinical-panel physician-disclosure"><summary>{c.cv}</summary><CvImport onReviewed={(file, text) => {
      const suggestions = cvSuggestions(text);
      setProfile(current => ({ ...current, fullName: current.fullName || suggestions.fullName, email: current.email || suggestions.email, phone: current.phone || suggestions.phone, title: current.title || suggestions.title,
        bio: current.bio || suggestions.bio, credentials: current.credentials || suggestions.credentials, specialties: current.specialties || suggestions.specialties, languages: current.languages || suggestions.languages }));
      setPendingCv({ file, text });
    }} /></details></div>;
}
