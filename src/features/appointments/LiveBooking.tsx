// Client visitor booking: four steps, server availability and encrypted server submission; no browser persistence.
"use client";
import BookingProgress from "@/features/booking/BookingProgress";
import BookingHeading from "@/features/booking/BookingHeading";
import ChoiceGroup from "@/features/booking/ChoiceGroup";
import Button from "@/components/ui/Button";
import LiveDateTimePicker, { slotKey } from "@/features/appointments/LiveDateTimePicker";
import { physicianName } from "@/lib/physician-name";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import type { AvailabilitySlot, PublicPhysician } from "@/types/clinical";
import type { BookingDetails, BookingErrors, BookingStep } from "@/types/booking";
import { CLINICAL_COPY as c, CLINICAL_POLICY } from "@/config/clinical";
import { BOOKING_REVIEW_COPY, LIVE_BOOKING_COPY } from "@/config/live-booking";
import { BOOKING_SETTINGS } from "@/config/booking";
import type { PracticeLocation } from "@/types/public";
import { emptyDetails } from "@/features/booking/state";
import { validateDetails } from "@/features/booking/validation";
import { formatDay, formatTime, practiceDate } from "@/features/booking/time";
import ContactFields from "@/features/booking/ContactFields";
import BookingChallenge from "@/features/appointments/BookingChallenge";
import { clinicalRequest } from "@/features/clinical/client";
import { availabilitySchema } from "@/features/clinical/contracts";
export default function LiveBooking({ providers, initialSlots, location, siteKey, smsEnabled, nonce, reviewMode = false, initialPhysicianId, selectionUnavailable = false }: { location: PracticeLocation; providers: PublicPhysician[]; initialSlots: AvailabilitySlot[]; siteKey: string; smsEnabled: boolean; reviewMode?: boolean; nonce?: string; initialPhysicianId?: string; selectionUnavailable?: boolean }) {
  const [slots, setSlots] = useState(initialSlots); const [step, setStep] = useState<BookingStep>(0); const [typeId, setTypeId] = useState("");
  const [physicianId, setPhysicianId] = useState(providers.some(provider => provider.id === initialPhysicianId) ? initialPhysicianId! : ""); const locationId = location.id;
  const [slotIndex, setSlotIndex] = useState(""); const [details, setDetails] = useState<BookingDetails>(emptyDetails); const [errors, setErrors] = useState<BookingErrors>({});
  const [consent, setConsent] = useState(false); const [token, setToken] = useState(""); const [challenge, setChallenge] = useState(0);
  const [busy, setBusy] = useState(false); const [message, setMessage] = useState(""); const [review, setReview] = useState(false); const [done, setDone] = useState(false);
  const idempotency = useRef<string | null>(null);
  const today = practiceDate(new Date().toISOString(), BOOKING_SETTINGS.timeZone);
  const selected = slots.find(slot => slotKey(slot) === slotIndex);
  const eligible = slots.filter(slot => slot.typeId === typeId && slot.locationId === locationId && (!physicianId || slot.physicianId === physicianId));
  async function refresh() {
    const result = await clinicalRequest(`/api/booking/availability?from=${today}`, availabilitySchema);
    if (result.ok) setSlots(result.data);
  }
  useEffect(() => {
    const reload = () => { if (document.visibilityState === "visible") void refresh(); };
    const timer = window.setInterval(reload, 30000); window.addEventListener("focus", reload);
    return () => { window.clearInterval(timer); window.removeEventListener("focus", reload); };
  });
  async function submit() {
    setMessage("");
    if (step < 3) { if ((step === 0 && !typeId) || (step === 2 && !selected)) { setMessage(c.select); return; } setStep((step + 1) as BookingStep); return; }
    const invalid = validateDetails(details, BOOKING_SETTINGS, new Date().toISOString()); setErrors(invalid);
    if (Object.keys(invalid).length || !consent || !selected) { setMessage(LIVE_BOOKING_COPY.errorSummary); return; }
    if (!review) { setReview(true); return; }
    if (!token || busy) return;
    setBusy(true); idempotency.current ??= crypto.randomUUID();
    try {
      const result = await clinicalRequest("/api/booking", z.object({ accepted: z.literal(true) }), { slot: { physicianId: selected.physicianId, locationId, typeId, startUtc: selected.startUtc },
        patient: { ...details, privacyConsent: true, consentVersion: CLINICAL_POLICY.consentVersion }, captcha: token, idempotencyKey: idempotency.current });
      if (result.ok) { setDone(true); setDetails(emptyDetails()); setToken(""); }
      else { setMessage(c.submitFailed); setChallenge(value => value + 1); await refresh(); }
    } finally { setBusy(false); }
  }
  const headingCopy = reviewMode ? { ...LIVE_BOOKING_COPY, completionTitle: BOOKING_REVIEW_COPY.complete, completionHighlight: "", completionBody: BOOKING_REVIEW_COPY.completeBody } : LIVE_BOOKING_COPY;
  const phase = done ? "complete" : review ? "review" : "editing";
  function goBack(nextStep: BookingStep) { setMessage(""); setReview(false); setStep(nextStep); }
  return <div className="booking-form-card">
    <BookingProgress step={step} copy={LIVE_BOOKING_COPY} disabled={busy} complete={done} onBack={goBack} />
    <BookingHeading state={{ step, phase }} copy={headingCopy} />
    {selectionUnavailable && <p role="status" className="booking-error-summary">{c.unavailablePhysician}</p>}
    {!done && <form onSubmit={event => { event.preventDefault(); void submit(); }} autoComplete="off" noValidate aria-labelledby="booking-step-heading" aria-busy={busy}>
      <fieldset disabled={busy} className="booking-fieldset">
        {message && <p role="alert" className="booking-error-summary">{message}</p>}
        <div key={`${step}-${phase}`} className="booking-step-content">
          {step === 0 && <ChoiceGroup name="appointmentType" legend={LIVE_BOOKING_COPY.steps[0].label}
            options={BOOKING_SETTINGS.types.filter(type => slots.some(slot => slot.typeId === type.id))} value={typeId}
            onChange={value => { setTypeId(value); setSlotIndex(""); }} />}
          {step === 1 && <div className="space-y-6"><ChoiceGroup name="physician" legend={c.provider}
            options={[{ id: "", label: LIVE_BOOKING_COPY.firstAvailable, description: LIVE_BOOKING_COPY.firstAvailableDescription },
              ...providers.map(provider => ({ id: provider.id, label: physicianName(provider), description: provider.specialties }))]}
            value={physicianId} onChange={value => { setPhysicianId(value); setSlotIndex(""); }} />
            <dl className="booking-summary"><div><dt>{c.location}</dt><dd>{location.label}<br />{location.address}</dd></div></dl>
          </div>}
          {step === 2 && <div className="space-y-6"><LiveDateTimePicker slots={eligible} providers={providers} value={slotIndex} onChange={setSlotIndex} today={today} />
            <Button onClick={() => void refresh()}>{c.refresh}</Button></div>}
          {step === 3 && (!review ? <div className="space-y-6">
            <ContactFields details={details} errors={errors} settings={BOOKING_SETTINGS} copy={LIVE_BOOKING_COPY} today={today} smsEnabled={smsEnabled} onChange={setDetails} />
            <label className="booking-consent"><input type="checkbox" required checked={consent} onChange={event => setConsent(event.target.checked)} /><span>{c.privacyConsent} <a className="underline" href="/privacy">{c.privacyLink}</a></span></label>
          </div> : <div className="space-y-6"><dl className="booking-summary">
            {[[c.type, BOOKING_SETTINGS.types.find(type => type.id === typeId)?.label],
              [c.provider, selected ? physicianName(providers.find(provider => provider.id === selected.physicianId)!) : c.noTimes],
              [c.location, `${location.label}\n${location.address}`], [c.patient, details.name], [c.contact, `${details.email}\n${details.phone}`],
              [c.birth, details.dateOfBirth], [c.reason, details.reason],
              [c.start, selected ? `${formatDay(practiceDate(selected.startUtc, BOOKING_SETTINGS.timeZone), BOOKING_SETTINGS.timeZone, "en-US")} ${formatTime(selected.startUtc, BOOKING_SETTINGS.timeZone, "en-US")} (${BOOKING_SETTINGS.timeZone})` : c.noTimes]]
              .map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
          </dl><BookingChallenge key={challenge} siteKey={siteKey} nonce={nonce} onToken={setToken} /></div>)}
        </div>
        {((step === 0 && !slots.length) || (step === 2 && !eligible.length)) && <p role="status" className="booking-error-summary">{c.noTimes}</p>}
        <div className="booking-actions">
          {step > 0 && <Button onClick={() => { setMessage(""); if (review) setReview(false); else goBack((step - 1) as BookingStep); }}>{review ? LIVE_BOOKING_COPY.edit : LIVE_BOOKING_COPY.back}</Button>}
          {review && <Button onClick={() => goBack(0)}>{LIVE_BOOKING_COPY.editAppointment}</Button>}
          <Button type="submit" purpose={review ? "booking" : "primary"} disabled={busy || (review && !token)}>
            {busy ? c.working : review ? LIVE_BOOKING_COPY.confirm : step === 3 ? LIVE_BOOKING_COPY.review : LIVE_BOOKING_COPY.next}
          </Button>
        </div>
      </fieldset>
    </form>}
  </div>;
}
