// Client time-off controls: turn labelled dates and times into the existing schedule arrays.
"use client";
import { useEffect, useState } from "react";
import type { ProviderSchedule } from "@/types/clinical";
import { dateSchema } from "@/features/clinical/validation";
import { APPOINTMENT_WORKSPACE as copy } from "@/config/appointment-workspace";
export default function ScheduleClosures({ value, onChange, onPendingChange }: { value: ProviderSchedule; onChange: (value: ProviderSchedule) => void; onPendingChange: (pending: boolean) => void }) {
  const [date, setDate] = useState("");
  const [period, setPeriod] = useState({ date: "", start: "", end: "" });
  const [error, setError] = useState("");
  useEffect(() => { onPendingChange(Boolean(date || period.date || period.start || period.end)); }, [date, period, onPendingChange]);
  function addDate() {
    if (value.blockedDates.length >= 366) { setError(copy.limit); return; }
    if (!dateSchema.safeParse(date).success || value.blockedDates.includes(date)) { setError(copy.invalidDay); return; }
    onChange({ ...value, blockedDates: [...value.blockedDates, date].sort() }); setDate(""); setError("");
  }
  function addPeriod() {
    if (value.blockedTimes.length >= 366) { setError(copy.limit); return; }
    if (!dateSchema.safeParse(period.date).success || !/^\d{2}:\d{2}$/.test(period.start) || !/^\d{2}:\d{2}$/.test(period.end) || period.start >= period.end) {
      setError(copy.invalidPeriod); return;
    }
    onChange({ ...value, blockedTimes: [...value.blockedTimes, period] });
    setPeriod({ date: "", start: "", end: "" }); setError("");
  }
  return <section className="schedule-form-section" aria-labelledby="schedule-time-off"><h3 id="schedule-time-off">{copy.exceptions}</h3><p>{copy.exceptionsHelp}</p>
    <div className="schedule-time-off-grid">
      <div className="schedule-time-off"><h4>{copy.fullDays}</h4><p>{copy.dayHelp}</p>
        <div className="schedule-inline"><label className="clinical-field">{copy.timeOffDate}<input type="date" value={date} onChange={event => setDate(event.target.value)} /></label><button type="button" className="clinical-button" onClick={addDate}>{copy.addDay}</button></div>
        {value.blockedDates.length ? <ul>{value.blockedDates.map(day => <li key={day}><span>{day}</span><button type="button" className="clinical-text-button" aria-label={`${copy.remove} ${day}`} onClick={() => onChange({ ...value, blockedDates: value.blockedDates.filter(item => item !== day) })}>{copy.remove}</button></li>)}</ul> : <p>{copy.noDays}</p>}
      </div>
      <div className="schedule-time-off"><h4>{copy.partialDays}</h4><p>{copy.partialHelp}</p>
        <label className="clinical-field">{copy.timeOffDate}<input type="date" value={period.date} onChange={event => setPeriod({ ...period, date: event.target.value })} /></label>
        <div className="schedule-fields">{(["start", "end"] as const).map(key => <label key={key} className="clinical-field">{copy[key]}<input type="time" value={period[key]} onChange={event => setPeriod({ ...period, [key]: event.target.value })} /></label>)}</div>
        <div className="clinical-actions"><button type="button" className="clinical-secondary" onClick={addPeriod}>{copy.addPeriod}</button></div>
        {value.blockedTimes.length ? <ul>{value.blockedTimes.map((item, index) => <li key={`${item.date}-${index}`}><span>{item.date} · {item.start}–{item.end}</span><button type="button" className="clinical-text-button" aria-label={`${copy.remove} ${item.date} ${item.start}–${item.end}`} onClick={() => onChange({ ...value, blockedTimes: value.blockedTimes.filter((_, position) => position !== index) })}>{copy.remove}</button></li>)}</ul> : <p>{copy.noPeriods}</p>}
      </div>
    </div>
    {error && <p className="clinical-error" role="alert">{error}</p>}
    <p className="schedule-save-reminder">{copy.saveTimeOff}</p>
  </section>;
}
