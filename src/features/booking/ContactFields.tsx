// Client component: minimum BK4 fields and optional explicit notification choices.
"use client";
import type { BookingDetails, BookingErrors, BookingSettings, DetailField } from "@/types/booking";
import type { BookingCopy } from "@/config/booking-copy";
export default function ContactFields({ details, errors, settings, copy, today, onChange, smsEnabled = true }: {
  details: BookingDetails; errors: BookingErrors; settings: BookingSettings; copy: BookingCopy; today: string; smsEnabled?: boolean;
  onChange: (details: BookingDetails) => void;
}) {
  const fields: Array<{ key: "name" | "phone" | "email" | "dateOfBirth"; label: string; type: string; limit?: number }> = [
    { key: "name", label: copy.name, type: "text", limit: settings.nameLimit }, { key: "phone", label: copy.phone, type: "tel", limit: 30 },
    { key: "email", label: copy.email, type: "email", limit: 254 }, { key: "dateOfBirth", label: copy.dateOfBirth, type: "date" },
  ];
  function error(field: DetailField) {
    return errors[field] && <span id={`booking-${field}-error`} className="booking-field-error">{copy.errors[errors[field]]}</span>;
  }
  return <div className="space-y-6"><div className="booking-fields-grid">{fields.map((field) => <label className="booking-field" htmlFor={`booking-${field.key}`} key={field.key}>
    {field.label}<input id={`booking-${field.key}`} name={field.key} type={field.type} value={details[field.key]} autoComplete="off" required maxLength={field.limit}
      max={field.type === "date" ? today : undefined} aria-invalid={!!errors[field.key]} aria-describedby={errors[field.key] ? `booking-${field.key}-error` : undefined}
      onChange={(event) => onChange({ ...details, [field.key]: event.target.value })} />{error(field.key)}
  </label>)}</div>
    <label className="booking-field" htmlFor="booking-reason">{copy.reason}<textarea id="booking-reason" name="reason" rows={3} value={details.reason} maxLength={settings.reasonLimit} required
      aria-invalid={!!errors.reason} aria-describedby={`booking-reason-hint${errors.reason ? " booking-reason-error" : ""}`} onChange={(event) => onChange({ ...details, reason: event.target.value })} />
      <span id="booking-reason-hint" className="text-sm text-textSecondary">{copy.reasonHint}</span>{error("reason")}
    </label>
    <fieldset className="space-y-4"><legend className="text-sm text-textSecondary mb-4">{copy.consentHint}</legend>
      {smsEnabled && <label className="booking-consent"><input name="smsConsent" type="checkbox" checked={details.smsConsent} onChange={(event) => onChange({ ...details, smsConsent: event.target.checked })} /><span>{copy.smsConsent}</span></label>}
      <label className="booking-consent"><input name="emailConsent" type="checkbox" checked={details.emailConsent} onChange={(event) => onChange({ ...details, emailConsent: event.target.checked })} /><span>{copy.emailConsent}</span></label>
    </fieldset>
  </div>;
}
