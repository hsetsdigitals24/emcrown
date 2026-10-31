// Client inbox: date/provider/status filters, pagination and reusable appointment actions.
"use client";
import { useState } from "react";
import type { Physician } from "@/types/clinical";
import type { PracticeLocation } from "@/types/public";
import { PRACTICE } from "@/config/practice";
import { inboxSchema, type InboxData } from "@/features/clinical/contracts";
import { clinicalRequest } from "@/features/clinical/client";
import { CLINICAL_COPY as c } from "@/config/clinical";
import AppointmentCard from "@/features/appointments/AppointmentCard";
import { APPOINTMENT_WORKSPACE as copy } from "@/config/appointment-workspace";
import { useToast } from "@/components/ui/ToastProvider";
export default function AppointmentInbox({ initial, providers, canManage, locations = PRACTICE.locations }: {
  locations?: PracticeLocation[]; initial: InboxData; providers: Physician[]; canManage: boolean;
}) {
  const [data, setData] = useState(initial); const [from, setFrom] = useState(""); const [status, setStatus] = useState("");
  const [physicianId, setPhysicianId] = useState(""); const [busy, setBusy] = useState(false); const notify = useToast();
  const [applied, setApplied] = useState({ from: "", status: "", physicianId: "" });
  const changed = from !== applied.from || status !== applied.status || physicianId !== applied.physicianId;
  async function load(page = data.page, filters = applied) {
    setBusy(true);
    try {
      const query = new URLSearchParams({ page: String(page), ...(filters.from ? { from: filters.from } : {}), ...(filters.status ? { status: filters.status } : {}), ...(filters.physicianId ? { physicianId: filters.physicianId } : {}) });
      const result = await clinicalRequest(`/emcrown-admin/appointments/api?${query}`, inboxSchema);
      if (result.ok) { setData(result.data); setApplied(filters); } else notify(c.error);
    } finally { setBusy(false); }
  }
  return <section className="clinical-panel appointment-inbox" aria-busy={busy}><div className="appointment-section-heading"><div><h2>{copy.inboxTitle}</h2><p>{copy.inboxIntro}</p></div><button type="button" className="clinical-text-button" disabled={busy} onClick={() => void load()}>{copy.refresh}</button></div>
    <form onSubmit={event => { event.preventDefault(); void load(0, { from, status, physicianId }); }}><fieldset disabled={busy}><div className="clinical-fields">
      <label className="clinical-field">{copy.from}<input type="date" value={from} onChange={event => setFrom(event.target.value)} /><small>{copy.fromHelp}</small></label>
      <label className="clinical-field">{c.provider}<select value={physicianId} onChange={event => setPhysicianId(event.target.value)}><option value="">{copy.allPhysicians}</option>{providers.map(provider => <option key={provider.id} value={provider.id}>{provider.fullName}</option>)}</select></label>
      <label className="clinical-field">{c.status}<select value={status} onChange={event => setStatus(event.target.value)}><option value="">{copy.allStatuses}</option>{(["requested", "confirmed", "cancelled", "completed", "no_show"] as const).map(value => <option key={value} value={value}>{c[value === "requested" ? "pending" : value]}</option>)}</select></label>
    </div><div className="clinical-actions"><button data-intent="primary" type="submit">{busy ? c.working : c.filter}</button><button data-intent="secondary" type="button" className="clinical-secondary" onClick={() => { setFrom(""); setStatus(""); setPhysicianId(""); void load(0, { from: "", status: "", physicianId: "" }); }}>{copy.reset}</button></div></fieldset></form>
    <div className="appointment-result-heading" role="status"><p>{changed ? copy.unsavedFilters : Object.values(applied).some(Boolean) ? copy.filtered : copy.unfiltered}</p><span>{copy.results}: {data.appointments.length}</span></div>
    {!data.appointments.length ? <div className="appointment-empty"><h3>{copy.emptyTitle}</h3><p>{copy.emptyHelp}</p></div> : <ul className="clinical-list">{data.appointments.map(appointment => <AppointmentCard key={`${appointment.id}:${appointment.version}`} appointment={appointment}
      locations={locations} providers={providers} canManage={canManage} messages={data.messages.filter(message => message.appointmentId === appointment.id)} onSaved={() => load()} />)}</ul>}
    {(data.page > 0 || data.hasMore) && <div className="clinical-actions"><span>{copy.page} {data.page + 1}</span><button data-intent="secondary" disabled={busy || data.page === 0} onClick={() => void load(data.page - 1)}>{c.previous}</button><button data-intent="secondary" disabled={busy || !data.hasMore} onClick={() => void load(data.page + 1)}>{c.next}</button></div>}
  </section>;
}
