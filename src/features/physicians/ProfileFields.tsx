// Client grouped profile fields: visible labels, example text and accessible inline errors.
"use client";
import { CLINICAL_COPY as c } from "@/config/clinical";
import { PHYSICIAN_FORM as copy } from "@/config/clinical-form";
import type { PhysicianProfile } from "@/types/clinical";
import PhotoInput from "@/features/physicians/PhotoInput";
export default function ProfileFields({ profile, errors, update, onPhotoBusy }: { profile: PhysicianProfile; errors: Record<string, string>; update: (key: keyof PhysicianProfile, value: string | boolean) => void; onPhotoBusy: (busy: boolean) => void }) {
  function input(key: "fullName" | "title" | "slug" | "email" | "phone") {
    const required = key === "fullName" || key === "slug" || (key === "email" && profile.notifyAppointments);
    return <label className="clinical-field" key={key} htmlFor={`physician-${key}`}><span>{c[key === "fullName" ? "name" : key]} <span className="clinical-field-tag">{required ? copy.required : copy.optional}</span></span>
      <input id={`physician-${key}`} name={key} type={key === "email" ? "email" : key === "phone" ? "tel" : "text"} value={profile[key]} required={required}
        maxLength={key === "email" ? 254 : key === "phone" ? 30 : key === "slug" ? 100 : 160} placeholder={copy.placeholders[key]} autoComplete="off"
        aria-invalid={Boolean(errors[key])} aria-describedby={`physician-${key}-help`} onChange={event => update(key, event.target.value)} />
      <small id={`physician-${key}-help`}>{errors[key] || (key === "slug" ? `${copy.slugHelp}${profile.slug || copy.placeholders.slug}` : "")}</small></label>;
  }
  return <><section className="clinical-form-section"><h3>{copy.identity}</h3><p>{copy.identityHelp}</p><div className="clinical-fields">{input("title")}{input("fullName")}{input("slug")}</div>
    <PhotoInput value={profile.photo} onChange={value => update("photo", value)} onBusy={onPhotoBusy} />{errors.photo && <p className="clinical-error" role="alert">{errors.photo}</p>}
  </section><section className="clinical-form-section"><h3>{copy.contact}</h3><p>{copy.contactHelp}</p><div className="clinical-fields">{input("email")}{input("phone")}</div>
    <label className="clinical-check clinical-setting"><input name="notifyAppointments" type="checkbox" checked={profile.notifyAppointments} onChange={event => update("notifyAppointments", event.target.checked)} /><span>{copy.alertLabel}<small>{copy.alertHelp}</small></span></label></section>
  <section className="clinical-form-section"><h3>{copy.biography}</h3><p>{copy.biographyHelp}</p><div className="clinical-fields">
    {(["bio", "credentials", "specialties", "languages"] as const).map(key => <label className={`clinical-field ${key === "bio" ? "clinical-field-wide" : ""}`} key={key} htmlFor={`physician-${key}`}><span>{c[key]} <span className="clinical-field-tag">{copy.optional}</span></span>
      <textarea id={`physician-${key}`} rows={key === "bio" ? 5 : 3} placeholder={copy.placeholders[key]} maxLength={key === "bio" ? 12000 : key === "languages" ? 1000 : 2000} value={profile[key]} aria-invalid={Boolean(errors[key])} aria-describedby={`physician-${key}-help`} onChange={event => update(key, event.target.value)} />
      <small id={`physician-${key}-help`}>{errors[key] || copy.hints[key]}</small></label>)}
  </div></section><label className="clinical-check clinical-setting"><input type="checkbox" checked={profile.active} onChange={event => update("active", event.target.checked)} /><span>{c.active}<small>{copy.activeHelp}</small></span></label></>;
}
