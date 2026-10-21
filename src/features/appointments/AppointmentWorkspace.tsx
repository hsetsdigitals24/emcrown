// Client inbox: date/provider/status filters, pagination and reusable appointment actions.
"use client";
import { useState } from "react";
import type { Physician } from "@/types/clinical";
import { inboxSchema, type InboxData } from "@/features/clinical/contracts";
import { clinicalRequest } from "@/features/clinical/client";
import { CLINICAL_COPY as c } from "@/config/clinical";
import AppointmentCard from "@/features/appointments/AppointmentCard";
import ScheduleEditor, { type ScheduleRecord } from "@/features/appointments/ScheduleEditor";
import { useToast } from "@/components/ui/ToastProvider";
export default function AppointmentWorkspace({ initial, providers, schedules, canManage, canSchedule, live }: {
  initial: InboxData; providers: Physician[]; schedules: ScheduleRecord[]; canManage: boolean; canSchedule: boolean; live: boolean;
}) {
  const [data, setData] = useState(initial); const [from, setFrom] = useState(""); const [status, setStatus] = useState("");
  const [physicianId, setPhysicianId] = useState(""); const [busy, setBusy] = useState(false); const notify = useToast();
  async function load(page = data.page) {
    setBusy(true);
    try {
      const query = new URLSearchParams({ page: String(page), ...(from ? { from } : {}), ...(status ? { status } : {}), ...(physicianId ? { physicianId } : {}) });
      const result = await clinicalRequest(`/emcrown-admin/appointments/api?${query}`, inboxSchema);
      if (result.ok) setData(result.data); else notify(c.error);
    } finally { setBusy(false); }
  }
  return <div className="clinical-layout"><section className="clinical-panel"><p>{c.appointmentIntro}</p>{!live && <p role="status">{c.unavailable}</p>}
    <form onSubmit={event => { event.preventDefault(); void load(0); }}><fieldset disabled={busy}><div className="clinical-fields">
      <label className="clinical-field">{c.date}<input type="date" value={from} onChange={event => setFrom(event.target.value)} /></label>
      <label className="clinical-field">{c.provider}<select value={physicianId} onChange={event => setPhysicianId(event.target.value)}><option value="">{c.all}</option>{providers.map(provider => <option key={provider.id} value={provider.id}>{provider.fullName}</option>)}</select></label>
      <label className="clinical-field">{c.status}<select value={status} onChange={event => setStatus(event.target.value)}><option value="">{c.all}</option>{(["requested", "confirmed", "cancelled", "completed", "no_show"] as const).map(value => <option key={value} value={value}>{c[value === "requested" ? "pending" : value]}</option>)}</select></label>
    </div><div className="clinical-actions"><button type="submit">{busy ? c.working : c.filter}</button></div></fieldset></form>
    {!data.appointments.length ? <p>{c.emptyAppointments}</p> : <ul className="clinical-list">{data.appointments.map(appointment => <AppointmentCard key={`${appointment.id}:${appointment.version}`} appointment={appointment}
      providers={providers} canManage={canManage} messages={data.messages.filter(message => message.appointmentId === appointment.id)} onSaved={() => load()} />)}</ul>}
    <div className="clinical-actions"><button disabled={busy || data.page === 0} onClick={() => void load(data.page - 1)}>{c.previous}</button><button disabled={busy || !data.hasMore} onClick={() => void load(data.page + 1)}>{c.next}</button></div>
  </section>{canSchedule && <ScheduleEditor providers={providers} initial={schedules} />}</div>;
}
