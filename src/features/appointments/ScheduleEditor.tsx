// Client schedule editor: explicit weekly rules and date closures; booking values stay configurable.
"use client";
import { PHYSICIAN_FORM as copy } from "@/config/clinical-form";
import { useState } from "react";
import { z } from "zod";
import { BOOKING_SETTINGS } from "@/config/booking";
import { PRACTICE } from "@/config/practice";
import { CLINICAL_COPY as c, CLINICAL_SCHEDULE_DEFAULTS } from "@/config/clinical";
import { clinicalRequest } from "@/features/clinical/client";
import { scheduleSchema } from "@/features/clinical/validation";
import type { Physician, ProviderSchedule } from "@/types/clinical";
import { useToast } from "@/components/ui/ToastProvider";
export type ScheduleRecord = { id: string; version: number; definition: ProviderSchedule };
export default function ScheduleEditor({ providers, initial }: { providers: Physician[]; initial: ScheduleRecord[] }) {
  const [rows, setRows] = useState(initial); const [selected, setSelected] = useState<ScheduleRecord>();
  const [busy, setBusy] = useState(false); const notify = useToast();
  const empty: ProviderSchedule = { physicianId: providers[0]?.id ?? "", locationId: BOOKING_SETTINGS.defaultLocationId, typeId: BOOKING_SETTINGS.types[0].id,
    ...CLINICAL_SCHEDULE_DEFAULTS, durationMinutes: BOOKING_SETTINGS.types[0].durationMinutes,
    leadHours: BOOKING_SETTINGS.types[0].leadHours, blockedDates: [], blockedTimes: [], enabled: true };
  const [definition, setDefinition] = useState(empty); const [blocked, setBlocked] = useState(""); const [blockedTime, setBlockedTime] = useState("");
  function select(row?: ScheduleRecord) { setSelected(row); setDefinition(row?.definition ?? empty); setBlocked(row?.definition.blockedDates.join("\n") ?? ""); setBlockedTime(row?.definition.blockedTimes.map(block => `${block.date} ${block.start} ${block.end}`).join("\n") ?? ""); }
  async function submit() {
    setBusy(true);
    try {
      const value = { ...definition, blockedDates: blocked.split(/\s+/).filter(Boolean), blockedTimes: blockedTime.split(/\n/).filter(line => line.trim()).map(line => { const [date, start, end] = line.trim().split(/\s+/); return { date, start, end }; }) };
      const result = await clinicalRequest("/emcrown-admin/appointments/schedules", z.null(), { id: selected?.id, version: selected?.version ?? 0, definition: value });
      if (!result.ok) { notify(result.code === "conflict" ? c.conflict : c.error); return; }
      const fresh = await clinicalRequest("/emcrown-admin/appointments/schedules", z.array(z.object({ id: z.uuid(), version: z.number(), definition: scheduleSchema })));
      if (fresh.ok) { setRows(fresh.data); select(); }
      notify(c.scheduleSaved, true);
    } finally { setBusy(false); }
  }
  const fields = [["opens", c.opens, "time"], ["closes", c.closes, "time"], ["intervalMinutes", c.step, "number"], ["durationMinutes", c.duration, "number"], ["bufferMinutes", c.buffer, "number"], ["leadHours", c.lead, "number"]] as const;
  return <section className="clinical-panel"><h2>{c.schedules}</h2><p>{copy.scheduleHelp}</p><div className="clinical-actions"><button onClick={() => select()}>{c.newSchedule}</button></div>
    <ul className="clinical-list">{rows.map(row => <li key={row.id}><button className="clinical-button" onClick={() => select(row)}>
      {providers.find(provider => provider.id === row.definition.physicianId)?.fullName} · {c.weekDays[row.definition.weekday]} · {row.definition.opens}–{row.definition.closes} · {row.definition.typeId}{!row.definition.enabled ? ` · ${c.disabled}` : ""}
    </button></li>)}</ul>
    <form onSubmit={event => { event.preventDefault(); void submit(); }}><fieldset disabled={busy || !providers.length}><div className="clinical-fields">
      <label className="clinical-field">{c.provider}<select value={definition.physicianId} disabled={Boolean(selected)} onChange={event => setDefinition({ ...definition, physicianId: event.target.value })}>{providers.map(provider => <option key={provider.id} value={provider.id}>{provider.fullName}</option>)}</select></label>
      <label className="clinical-field">{c.location}<select value={definition.locationId} onChange={event => setDefinition({ ...definition, locationId: event.target.value })}>{PRACTICE.locations.map(location => <option key={location.id} value={location.id}>{location.label}</option>)}</select></label>
      <label className="clinical-field">{c.type}<select value={definition.typeId} onChange={event => setDefinition({ ...definition, typeId: event.target.value })}>{BOOKING_SETTINGS.types.map(type => <option key={type.id} value={type.id}>{type.label}</option>)}</select></label>
      <label className="clinical-field">{c.weekday}<select value={definition.weekday} onChange={event => setDefinition({ ...definition, weekday: Number(event.target.value) })}>{c.weekDays.map((day, index) => <option key={day} value={index}>{day}</option>)}</select></label>
      {fields.map(([key, label, type]) => <label className="clinical-field" key={key}>{label}<input type={type} value={definition[key]} min={0} required onChange={event => setDefinition({ ...definition, [key]: type === "number" ? Number(event.target.value) : event.target.value })} /></label>)}
    </div><label className="clinical-field">{c.blocked}<textarea rows={4} placeholder={copy.blockedPlaceholder} value={blocked} onChange={event => setBlocked(event.target.value)} /></label>
    <label className="clinical-field">{c.blockedTime}<textarea rows={3} placeholder={copy.blockedTimePlaceholder} value={blockedTime} onChange={event => setBlockedTime(event.target.value)} /></label>
    <label className="clinical-check"><input type="checkbox" checked={definition.enabled} onChange={event => setDefinition({ ...definition, enabled: event.target.checked })} />{c.enabled}</label>
    <div className="clinical-actions"><button type="submit">{busy ? c.working : c.addSchedule}</button></div></fieldset></form>
  </section>;
}
