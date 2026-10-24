// Client availability workspace: browse saved hours and explicitly open a guided editor.
"use client";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { BOOKING_SETTINGS } from "@/config/booking";
import type { PracticeLocation } from "@/types/public";
import { PRACTICE } from "@/config/practice";
import { CLINICAL_COPY as c, CLINICAL_SCHEDULE_DEFAULTS } from "@/config/clinical";
import { APPOINTMENT_WORKSPACE as copy } from "@/config/appointment-workspace";
import { clinicalRequest } from "@/features/clinical/client";
import { scheduleSchema } from "@/features/clinical/validation";
import type { Physician, ProviderSchedule } from "@/types/clinical";
import { useUnsavedChanges } from "@/features/cms/useUnsavedChanges";
import { useToast } from "@/components/ui/ToastProvider";
import ScheduleFields from "@/features/appointments/ScheduleFields";
import ScheduleClosures from "@/features/appointments/ScheduleClosures";
export type ScheduleRecord = { id: string; version: number; definition: ProviderSchedule };
const responseSchema = z.array(z.object({ id: z.uuid(), version: z.number(), definition: scheduleSchema }));
export default function ScheduleEditor({ providers, initial, locations = PRACTICE.locations }: { locations?: PracticeLocation[]; providers: Physician[]; initial: ScheduleRecord[] }) {
  const [rows, setRows] = useState(initial);
  const [selected, setSelected] = useState<ScheduleRecord>();
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const notify = useToast();
  const heading = useRef<HTMLHeadingElement>(null);
  const errorMessage = useRef<HTMLParagraphElement>(null);
  const empty: ProviderSchedule = { physicianId: providers[0]?.id ?? "", locationId: BOOKING_SETTINGS.defaultLocationId, typeId: BOOKING_SETTINGS.types[0].id,
    ...CLINICAL_SCHEDULE_DEFAULTS, durationMinutes: BOOKING_SETTINGS.types[0].durationMinutes,
    leadHours: BOOKING_SETTINGS.types[0].leadHours, blockedDates: [], blockedTimes: [], enabled: true };
  const [definition, setDefinition] = useState(empty);
  const dirty = pending || JSON.stringify(definition) !== JSON.stringify(selected?.definition ?? empty);
  useUnsavedChanges(editing && dirty, copy.discard);
  useEffect(() => { if (editing) heading.current?.focus(); }, [editing, selected]);
  useEffect(() => { if (error) errorMessage.current?.focus(); }, [error]);
  function updateDefinition(value: ProviderSchedule) { setDefinition(value); setError(""); }
  function select(row?: ScheduleRecord) {
    if (editing && dirty && !window.confirm(copy.discard)) return;
    setSelected(row); setDefinition(row?.definition ?? empty); setEditing(true); setPending(false); setError("");
  }
  function close() {
    if (dirty && !window.confirm(copy.discard)) return;
    setEditing(false); setPending(false); setError("");
  }
  async function refresh() {
    const fresh = await clinicalRequest("/emcrown-admin/appointments/schedules", responseSchema);
    if (fresh.ok) setRows(fresh.data);
    return fresh.ok;
  }
  async function submit() {
    if (busy) return;
    if (pending) { setError(copy.pendingTimeOff); return; }
    const parsed = scheduleSchema.safeParse(definition);
    if (!parsed.success) { setError(copy.invalid); return; }
    setBusy(true); setError("");
    try {
      const result = await clinicalRequest("/emcrown-admin/appointments/schedules", z.null(), { id: selected?.id, version: selected?.version ?? 0, definition: parsed.data });
      if (!result.ok) { setError(result.code === "conflict" ? c.conflict : c.error); return; }
      // A successful write must never leave the same create form available for a duplicate retry.
      setEditing(false); setPending(false);
      notify(await refresh() ? c.scheduleSaved : copy.savedRefresh, true);
    } finally { setBusy(false); }
  }
  return <section className="clinical-panel schedule-workspace">
    <div className="appointment-section-heading"><div><h2>{copy.availabilityTitle}</h2><p>{copy.availabilityIntro}</p></div>
      {!editing && providers.length > 0 && <button type="button" className="clinical-button" disabled={busy} onClick={() => select()}>{copy.add}</button>}
    </div>
    {!providers.length && <div className="appointment-empty"><p>{copy.noProviders}</p></div>}
    {!editing ? <>
      {!rows.length && providers.length > 0 && <div className="appointment-empty"><h3>{copy.emptySchedule}</h3><p>{copy.emptyScheduleHelp}</p></div>}
      <ul className="schedule-list">{rows.map(row => <li key={row.id}>
        <div><h3>{providers.find(provider => provider.id === row.definition.physicianId)?.fullName}</h3>
          <p className="schedule-hours">{c.weekDays[row.definition.weekday]} · {row.definition.opens}–{row.definition.closes}</p>
          <p>{BOOKING_SETTINGS.types.find(type => type.id === row.definition.typeId)?.label ?? row.definition.typeId} · {locations.find(location => location.id === row.definition.locationId)?.label}</p>
          <small>{copy.exclusions}: {row.definition.blockedDates.length + row.definition.blockedTimes.length}</small>
        </div>
        <div className="schedule-row-actions"><span className={`schedule-state ${row.definition.enabled ? "is-enabled" : ""}`}>{row.definition.enabled ? copy.enabled : copy.disabled}</span>
          <button type="button" className="clinical-button" disabled={busy} onClick={() => select(row)}>{copy.edit}<span className="sr-only"> · {providers.find(provider => provider.id === row.definition.physicianId)?.fullName} · {c.weekDays[row.definition.weekday]} · {row.definition.opens}</span></button>
        </div>
      </li>)}</ul>
      <div className="clinical-actions"><button type="button" className="clinical-secondary" disabled={busy} onClick={async () => { setBusy(true); try { if (!await refresh()) notify(c.error); } finally { setBusy(false); } }}>{copy.refreshSchedules}</button></div>
      <p className="clinical-save-help">{copy.nextStep}</p>
    </> : <form noValidate onSubmit={event => { event.preventDefault(); void submit(); }}>
      <fieldset disabled={busy || !providers.length}><div className="schedule-editor-heading"><h3 ref={heading} tabIndex={-1}>{selected ? copy.editTitle : copy.createTitle}</h3><button type="button" className="clinical-text-button" onClick={close}>{copy.close}</button></div>
        {error && <p ref={errorMessage} tabIndex={-1} className="clinical-error" role="alert">{error}</p>}
        <ScheduleFields locations={locations} value={definition} onChange={updateDefinition} providers={providers} editing={Boolean(selected)} />
        <ScheduleClosures key={selected?.id ?? "new"} value={definition} onChange={updateDefinition} onPendingChange={setPending} />
        <div className="clinical-setting"><label className="clinical-check"><input type="checkbox" checked={definition.enabled} onChange={event => updateDefinition({ ...definition, enabled: event.target.checked })} /><strong>{copy.active}</strong></label><small>{copy.activeHelp}</small></div>
        <div className="clinical-actions clinical-form-actions"><button type="submit">{busy ? c.working : copy.save}</button><button type="button" className="clinical-secondary" onClick={close}>{c.cancel}</button></div>
      </fieldset>
    </form>}
  </section>;
}
