// Client calendar: native radio keyboard behavior, labelled dates and bounded month navigation.
"use client";
import { useState } from "react";
import { CALENDAR_COPY } from "@/config/business-hours";
import { calendarCells, shiftMonth } from "@/features/booking/calendar";
import { formatDay } from "@/features/booking/time";
export default function BookingCalendar({ dates, value, onChange, referenceDate, timeZone, locale, label }: {
  dates: string[]; value: string; onChange: (date: string) => void; referenceDate: string;
  timeZone: string; locale: string; label: string;
}) {
  const sorted = [...dates].sort();
  const first = (sorted[0] ?? referenceDate).slice(0, 7);
  const last = (sorted.at(-1) ?? referenceDate).slice(0, 7);
  const [month, setMonth] = useState((value || sorted[0] || referenceDate).slice(0, 7));
  const visible = month < first ? first : month > last ? last : month;
  const heading = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${visible}-01T12:00:00Z`));
  return <fieldset className="booking-calendar"><legend>{label}</legend>
    <div className="calendar-heading"><button type="button" aria-label={CALENDAR_COPY.previous} disabled={visible <= first} onClick={() => setMonth(shiftMonth(visible, -1))}>‹</button>
      <p aria-live="polite" aria-atomic="true">{heading}</p>
      <button type="button" aria-label={CALENDAR_COPY.next} disabled={visible >= last} onClick={() => setMonth(shiftMonth(visible, 1))}>›</button>
    </div>
    <div className="calendar-weekdays" aria-hidden="true">{CALENDAR_COPY.weekdays.map(day => <span key={day}>{day}</span>)}</div>
    <div className="calendar-days">{calendarCells(visible).map(day => day.current ? <label key={day.id} className="calendar-day" data-unavailable={!dates.includes(day.id)}>
      <input type="radio" name="date" className="sr-only" value={day.id} checked={value === day.id} disabled={!dates.includes(day.id)} onChange={() => onChange(day.id)}
        aria-label={formatDay(day.id, timeZone, locale)} />
      <span aria-hidden="true">{day.number}</span>
    </label> : <span key={day.id} className="calendar-empty" />)}</div>
    {value && <p className="calendar-selected">{CALENDAR_COPY.selected}: {formatDay(value, timeZone, locale)}</p>}
  </fieldset>;
}
