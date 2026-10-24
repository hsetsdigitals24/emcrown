// Client appointment detail: explicit audited mutations and server-validated rebooking slots.
"use client";
import { useState } from "react";
import { z } from "zod";
import type { Appointment, AvailabilitySlot, Physician } from "@/types/clinical";
import { APPOINTMENT_WORKSPACE as copy } from "@/config/appointment-workspace";
import { CLINICAL_COPY as c } from "@/config/clinical";
import { BOOKING_SETTINGS } from "@/config/booking";
import type { PracticeLocation } from "@/types/public";
import { PRACTICE } from "@/config/practice";
import { formatDay, formatTime, practiceDate } from "@/features/booking/time";
import { clinicalRequest } from "@/features/clinical/client";
import { availabilitySchema } from "@/features/clinical/contracts";
import MessageStatusList from "@/features/notifications/MessageStatusList";
import type { NotificationMessage } from "@/features/notifications/contracts";
import { useToast } from "@/components/ui/ToastProvider";
export function slotLabel(slot: { startUtc: string; physicianId: string }, providers: Array<{ id: string; fullName: string }>) {
  return `${formatDay(practiceDate(slot.startUtc, BOOKING_SETTINGS.timeZone), BOOKING_SETTINGS.timeZone, "en-US")} · ${formatTime(slot.startUtc, BOOKING_SETTINGS.timeZone, "en-US")} · ${providers.find(provider => provider.id === slot.physicianId)?.fullName ?? ""}`;
}
export default function AppointmentCard({ appointment: a, providers, canManage, messages, onSaved, locations = PRACTICE.locations }: {
  locations?: PracticeLocation[]; appointment: Appointment; providers: Physician[]; canManage: boolean; messages: NotificationMessage[]; onSaved: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false); const [rebooking, setRebooking] = useState(false);
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]); const [selected, setSelected] = useState("");
  const [from, setFrom] = useState(practiceDate(new Date().toISOString(), BOOKING_SETTINGS.timeZone)); const notify = useToast();
  async function loadSlots() {
    setBusy(true);
    try {
      const result = await clinicalRequest(`/emcrown-admin/appointments/availability?from=${from}&exceptId=${a.id}`, availabilitySchema);
      if (result.ok) { setSlots(result.data); setSelected(""); setRebooking(true); } else notify(c.error);
    } finally { setBusy(false); }
  }
  async function mutate(operation: "confirm" | "cancel" | "complete" | "no_show" | "rebook") {
    if (busy || (operation === "cancel" && !window.confirm(c.confirmCancel))) return;
    const slot = slots.find((_, index) => String(index) === selected);
    setBusy(true);
    try {
      const result = await clinicalRequest("/emcrown-admin/appointments/api", z.null(), { id: a.id, version: a.version, operation,
        ...(operation === "rebook" && slot ? { slot: { physicianId: slot.physicianId, locationId: slot.locationId, typeId: slot.typeId, startUtc: slot.startUtc } } : {}) });
      if (!result.ok) { notify(result.code === "conflict" ? c.conflict : c.error); return; }
      notify(c.appointmentSaved, true); await onSaved(); setRebooking(false);
    } finally { setBusy(false); }
  }
  const finished = ["completed", "no_show"].includes(a.status);
  return <li className="appointment-card"><div className="appointment-card-heading"><h3>{a.patient.name}</h3><span className="schedule-state" data-status={a.status}>{c[a.status === "requested" ? "pending" : a.status]}</span></div><p className="appointment-card-time">{slotLabel(a, providers)}</p>
    <p>{BOOKING_SETTINGS.types.find(type => type.id === a.typeId)?.label} · {locations.find(location => location.id === a.locationId)?.label}</p>
    <details><summary>{c.review}</summary><dl className="clinical-details">
      {[[c.type, BOOKING_SETTINGS.types.find(type => type.id === a.typeId)?.label], [c.location, locations.find(location => location.id === a.locationId)?.label],
        [c.birth, a.patient.dateOfBirth], [c.contact, `${a.patient.email}\n${a.patient.phone}`], [c.reason, a.patient.reason],
        [c.consent, `${c.email}: ${a.patient.emailConsent ? "✓" : "—"} · SMS: ${a.patient.smsConsent ? "✓" : "—"}`]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
    </dl><h4>{c.notifications}</h4><MessageStatusList messages={messages} /></details>
    {canManage && !finished && <fieldset disabled={busy}><div className="clinical-actions">
      {a.status === "requested" && <button onClick={() => void mutate("confirm")}>{c.confirm}</button>}
      <button className="clinical-secondary" onClick={() => void loadSlots()}>{copy.reschedule}</button>
      {a.status !== "cancelled" && new Date(a.endUtc) <= new Date() && <><button className="clinical-secondary" onClick={() => void mutate("complete")}>{copy.complete}</button><button className="clinical-secondary" onClick={() => void mutate("no_show")}>{copy.missed}</button></>}
      {a.status !== "cancelled" && <button className="appointment-cancel" onClick={() => void mutate("cancel")}>{c.cancelVisit}</button>}
    </div>{rebooking && <div><label className="clinical-field">{c.date}<input type="date" value={from} onChange={event => setFrom(event.target.value)} /></label>
      <div className="clinical-actions"><button onClick={() => void loadSlots()}>{c.refresh}</button></div><label className="clinical-field">{c.start}<select value={selected} onChange={event => setSelected(event.target.value)}><option value="">{c.select}</option>
        {slots.map((slot, index) => <option key={index} value={index}>{slotLabel(slot, providers)} · {slot.typeId} · {slot.locationId}</option>)}</select></label>
      {!slots.length && <p>{c.noResults}</p>}<div className="clinical-actions"><button disabled={!selected} onClick={() => void mutate("rebook")}>{copy.reschedule}</button><button className="clinical-secondary" onClick={() => setRebooking(false)}>{copy.closeReschedule}</button></div></div>}
    </fieldset>}
  </li>;
}
