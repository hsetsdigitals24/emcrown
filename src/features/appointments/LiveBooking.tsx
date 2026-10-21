// Client visitor booking: four steps, server availability and encrypted server submission; no browser persistence.
"use client";
import LiveDateTimePicker, { slotKey } from "@/features/appointments/LiveDateTimePicker";
import { physicianName } from "@/lib/physician-name";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import type { AvailabilitySlot, PublicPhysician } from "@/types/clinical";
import type { BookingDetails, BookingErrors } from "@/types/booking";
import { CLINICAL_COPY as c, CLINICAL_POLICY } from "@/config/clinical";
import { LIVE_BOOKING_COPY } from "@/config/live-booking";
import { BOOKING_SETTINGS } from "@/config/booking";
import { PRACTICE } from "@/config/practice";
import { emptyDetails } from "@/features/booking/state";
import { validateDetails } from "@/features/booking/validation";
import { formatDay, formatTime, practiceDate } from "@/features/booking/time";
import ContactFields from "@/features/booking/ContactFields";
import BookingChallenge from "@/features/appointments/BookingChallenge";
import { clinicalRequest } from "@/features/clinical/client";
import { availabilitySchema } from "@/features/clinical/contracts";
export default function LiveBooking({ providers, initialSlots, siteKey, smsEnabled, nonce, initialPhysicianId, selectionUnavailable = false }: { providers: PublicPhysician[]; initialSlots: AvailabilitySlot[]; siteKey: string; smsEnabled: boolean; nonce?: string; initialPhysicianId?: string; selectionUnavailable?: boolean }) {
  const [slots, setSlots] = useState(initialSlots); const [step, setStep] = useState(0); const [typeId, setTypeId] = useState("");
  const [physicianId, setPhysicianId] = useState(providers.some(provider => provider.id === initialPhysicianId) ? initialPhysicianId! : ""); const [locationId, setLocationId] = useState(BOOKING_SETTINGS.defaultLocationId);
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
    if (step < 3) { if ((step === 0 && !typeId) || (step === 2 && !selected)) { setMessage(c.select); return; } setStep(step + 1); return; }
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
  if (done) return <section className="clinical-booking"><h1>{c.booked}</h1><p>{c.bookedBody}</p></section>;
  return <section className="clinical-booking"><h1>{c.book}</h1><p>{c.bookingIntro}</p><p>{c.liveNotice}</p>{selectionUnavailable && <p role="status">{c.unavailablePhysician}</p>}{physicianId && <aside className="booking-demo-notice"><h2>{c.selectedPhysician}: {physicianName(providers.find(provider => provider.id === physicianId)!)}</h2><p>{c.changePhysicianHelp}</p>{typeId && !eligible.length && <p role="status">{c.noTimes}</p>}</aside>}{!slots.length && <p role="status">{c.noTimes}</p>}<p>{LIVE_BOOKING_COPY.stepLabel} {step + 1} {LIVE_BOOKING_COPY.ofLabel} 4</p>
    <form className="clinical-panel" onSubmit={event => { event.preventDefault(); void submit(); }}><fieldset disabled={busy}>
      {message && <p role="alert" className="clinical-error">{message}</p>}
      {step === 0 && <label className="clinical-field">{c.type}<select required value={typeId} onChange={event => { setTypeId(event.target.value); setSlotIndex(""); }}>{<option value="">{c.select}</option>}{BOOKING_SETTINGS.types.filter(type => slots.some(slot => slot.typeId === type.id)).map(type => <option key={type.id} value={type.id}>{type.label}</option>)}</select></label>}
      {step === 1 && <><label className="clinical-field">{c.provider}<select value={physicianId} onChange={event => { setPhysicianId(event.target.value); setSlotIndex(""); }}><option value="">{LIVE_BOOKING_COPY.firstAvailable}</option>{providers.map(provider => <option key={provider.id} value={provider.id}>{physicianName(provider)}</option>)}</select></label>
        <label className="clinical-field">{c.location}<select value={locationId} onChange={event => { setLocationId(event.target.value); setSlotIndex(""); }}>{PRACTICE.locations.map(location => <option key={location.id} value={location.id}>{location.label}</option>)}</select></label></>}
      {step === 2 && <><LiveDateTimePicker slots={eligible} providers={providers} value={slotIndex} onChange={setSlotIndex} today={today} /><button type="button" className="clinical-button" onClick={() => void refresh()}>{c.refresh}</button></>}
      {step === 3 && <>{!review ? <><ContactFields details={details} errors={errors} settings={BOOKING_SETTINGS} copy={LIVE_BOOKING_COPY} today={today} smsEnabled={smsEnabled} onChange={setDetails} />
        <label className="clinical-check"><input type="checkbox" required checked={consent} onChange={event => setConsent(event.target.checked)} /><span>{c.privacyConsent} <a href="/privacy">{c.privacyLink}</a></span></label></>
        : <><h2>{c.review}</h2><dl className="clinical-details">{[[c.patient, details.name], [c.contact, `${details.email}\n${details.phone}`], [c.birth, details.dateOfBirth], [c.reason, details.reason], [c.start, selected ? `${formatDay(practiceDate(selected.startUtc, BOOKING_SETTINGS.timeZone), BOOKING_SETTINGS.timeZone, "en-US")} ${formatTime(selected.startUtc, BOOKING_SETTINGS.timeZone, "en-US")}` : c.noTimes]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
          <BookingChallenge key={challenge} siteKey={siteKey} nonce={nonce} onToken={setToken} /></>}</>}
      <div className="clinical-actions">{step > 0 && <button type="button" onClick={() => { setMessage(""); if (review) setReview(false); else setStep(step - 1); }}>{LIVE_BOOKING_COPY.back}</button>}
        <button type="submit" disabled={busy || (review && !token)}>{busy ? c.working : review ? c.book : step === 3 ? c.review : LIVE_BOOKING_COPY.next}</button></div>
    </fieldset></form>
  </section>;
}
