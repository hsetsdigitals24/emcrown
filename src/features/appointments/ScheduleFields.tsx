// Client form sections: explain the schedule essentials before optional timing controls.
"use client";
import { BOOKING_SETTINGS } from "@/config/booking";
import type { PracticeLocation } from "@/types/public";
import { PRACTICE } from "@/config/practice";
import { CLINICAL_COPY as c } from "@/config/clinical";
import { APPOINTMENT_WORKSPACE as copy } from "@/config/appointment-workspace";
import type { Physician, ProviderSchedule } from "@/types/clinical";
export default function ScheduleFields({ value, onChange, providers, editing, locations = PRACTICE.locations }: {
  locations?: PracticeLocation[]; value: ProviderSchedule; onChange: (value: ProviderSchedule) => void; providers: Physician[]; editing: boolean;
}) {
  const advanced = [["intervalMinutes", c.step, 5, 180], ["bufferMinutes", c.buffer, 0, 120], ["leadHours", c.lead, 0, 720]] as const;
  return <>
    <section className="schedule-form-section" aria-labelledby="schedule-basics"><h3 id="schedule-basics">{copy.basics}</h3><p>{copy.basicsHelp}</p>
      <div className="schedule-fields">
        <label className="clinical-field">{c.provider}<select name="physicianId" value={value.physicianId} disabled={editing} onChange={event => onChange({ ...value, physicianId: event.target.value })}>{providers.map(provider => <option key={provider.id} value={provider.id}>{provider.fullName}</option>)}</select></label>
        <label className="clinical-field">{c.location}<select name="locationId" value={value.locationId} onChange={event => onChange({ ...value, locationId: event.target.value })}>{locations.map(location => <option key={location.id} value={location.id}>{location.label}</option>)}</select></label>
        <label className="clinical-field">{c.type}<select name="typeId" value={value.typeId} onChange={event => onChange({ ...value, typeId: event.target.value })}>{BOOKING_SETTINGS.types.map(type => <option key={type.id} value={type.id}>{type.label}</option>)}</select></label>
        <label className="clinical-field">{c.weekday}<select name="weekday" value={value.weekday} onChange={event => onChange({ ...value, weekday: Number(event.target.value) })}>{c.weekDays.map((day, index) => <option key={day} value={index}>{day}</option>)}</select></label>
      </div>
    </section>
    <section className="schedule-form-section" aria-labelledby="schedule-hours"><h3 id="schedule-hours">{copy.hours}</h3><p>{copy.hoursHelp}</p>
      <div className="schedule-fields">
        {(["opens", "closes"] as const).map(key => <label className="clinical-field" key={key}>{c[key]}<input name={key} type="time" required value={value[key]} onChange={event => onChange({ ...value, [key]: event.target.value })} /></label>)}
        <label className="clinical-field">{c.duration}<input name="durationMinutes" type="number" min={5} max={180} required value={value.durationMinutes} onChange={event => onChange({ ...value, durationMinutes: Number(event.target.value) })} /><small>{copy.fieldHelp.durationMinutes}</small></label>
      </div>
      <details className="schedule-advanced"><summary>{copy.advanced}</summary><p>{copy.advancedHelp}</p><div className="schedule-fields">
        {advanced.map(([key, label, min, max]) => <label className="clinical-field" key={key}>{label}<input name={key} type="number" min={min} max={max} required value={value[key]} onChange={event => onChange({ ...value, [key]: Number(event.target.value) })} /><small>{copy.fieldHelp[key]}</small></label>)}
      </div></details>
    </section>
  </>;
}
