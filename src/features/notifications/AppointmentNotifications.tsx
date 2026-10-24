// Client management: review current inbox messages and privately manage physician email preferences.
"use client";
import { useState } from "react";
import type { Physician } from "@/types/clinical";
import { inboxSchema, type InboxData } from "@/features/clinical/contracts";
import { clinicalRequest } from "@/features/clinical/client";
import { NOTIFICATION_COPY as copy } from "@/config/notifications";
import { notificationNeedsAttention } from "@/features/notifications/status";
import MessageStatusList from "@/features/notifications/MessageStatusList";
import PhysicianAlertSettings from "@/features/notifications/PhysicianAlertSettings";
import { slotLabel } from "@/features/appointments/AppointmentCard";
export default function AppointmentNotifications({ initial, providers, canManage, tracking }: { initial: InboxData; providers: Physician[]; canManage: boolean; tracking: boolean }) {
  const [data, setData] = useState(initial); const [audience, setAudience] = useState("all");
  const [busy, setBusy] = useState(false); const [error, setError] = useState(false);
  const messages = data.messages.filter(message => audience === "all" || message.channel === audience);
  async function refresh(page = data.page) {
    setBusy(true);
    const result = await clinicalRequest(`/emcrown-admin/appointments/api?page=${page}`, inboxSchema);
    setBusy(false); setError(!result.ok); if (result.ok) setData(result.data);
  }
  return <div className="clinical-layout"><section className="clinical-panel"><div className="appointment-section-heading"><div><h2>{copy.management}</h2><p>{copy.managementHelp}</p></div>
    <button type="button" className="clinical-text-button" disabled={busy} onClick={() => void refresh()}>{copy.refresh}</button></div>
    <p className="notification-tracking">{tracking ? copy.deliveryHelp : copy.trackingOff}</p>
    <p>{copy.scope}</p>
    {error && <p role="alert" className="clinical-error">{copy.error}</p>}
    <div className="notification-totals">{[[copy.counts, messages.length], [copy.failedCount, messages.filter(notificationNeedsAttention).length], [copy.deliveryCount, tracking ? messages.filter(message => message.deliveryStatus === "delivered").length : "—"], [copy.queuedCount, messages.filter(message => message.state === "queued").length]].map(([label, count]) => <div key={label}><strong>{count}</strong><span>{label}</span></div>)}</div>
    <label className="clinical-field">{copy.filter}<select value={audience} onChange={event => setAudience(event.target.value)}>
      {[["all", copy.all], ["email", copy.patient], ["physician", copy.physician], ["staff", copy.staff], ["sms", copy.sms]].map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
    {!messages.length && <p>{copy.noMessages}</p>}
    {data.appointments.filter(appointment => messages.some(message => message.appointmentId === appointment.id)).map(appointment => <details key={appointment.id} className="notification-appointment" open>
      <summary><strong>{appointment.patient.name}</strong><span>{slotLabel(appointment, providers)}</span></summary>
      <MessageStatusList messages={messages.filter(message => message.appointmentId === appointment.id)} />
    </details>)}
    <div className="clinical-actions"><span>{copy.page} {data.page + 1}</span><button type="button" disabled={busy || data.page === 0} onClick={() => void refresh(data.page - 1)}>{copy.previous}</button><button type="button" disabled={busy || !data.hasMore} onClick={() => void refresh(data.page + 1)}>{copy.next}</button></div>
    </section>{canManage && <PhysicianAlertSettings providers={providers} />}</div>;
}
