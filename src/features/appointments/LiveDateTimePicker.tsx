// Client live calendar: render only real returned slots, never fabricated office-hour availability.
"use client";
import { useState } from "react";
import BookingCalendar from "@/features/booking/BookingCalendar";
import BookingTimes from "@/features/booking/BookingTimes";
import { BUSINESS_HOURS, CALENDAR_COPY } from "@/config/business-hours";
import { BOOKING_SETTINGS } from "@/config/booking";
import { CLINICAL_COPY } from "@/config/clinical";
import { formatTime, practiceDate } from "@/features/booking/time";
import { physicianName } from "@/lib/physician-name";
import type { AvailabilitySlot, PublicPhysician } from "@/types/clinical";
export function slotKey(slot: AvailabilitySlot) { return `${slot.physicianId}:${slot.locationId}:${slot.typeId}:${slot.startUtc}`; }
export default function LiveDateTimePicker({ slots, providers, value, onChange, today }: {
  slots: AvailabilitySlot[]; providers: PublicPhysician[]; value: string; onChange: (value: string) => void; today: string;
}) {
  const { timeZone, locale } = BOOKING_SETTINGS;
  const dates = [...new Set(slots.map(slot => practiceDate(slot.startUtc, timeZone)))].sort();
  const [date, setDate] = useState("");
  const selected = slots.find(slot => slotKey(slot) === value);
  const activeDate = selected ? practiceDate(selected.startUtc, timeZone) : dates.includes(date) ? date : dates[0] ?? "";
  // First available presents each time once, keeping a deterministic physician assignment.
  const daily = slots.filter(slot => practiceDate(slot.startUtc, timeZone) === activeDate).filter((slot, index, list) => list.findIndex(item => item.startUtc === slot.startUtc) === index);
  return <div><p className="booking-hours">{BUSINESS_HOURS.label}<span>{timeZone}</span></p><div className="booking-date-time">
    <BookingCalendar dates={dates} value={activeDate} onChange={next => { setDate(next); onChange(""); }} referenceDate={today} timeZone={timeZone} locale={locale} label={CALENDAR_COPY.date} />
    <div className="booking-time-panel">{daily.length ? <BookingTimes label={CALENDAR_COPY.time} value={value} onChange={onChange} options={daily.map(slot => ({ id: slotKey(slot), label: formatTime(slot.startUtc, timeZone, locale), description: providers.find(provider => provider.id === slot.physicianId) ? physicianName(providers.find(provider => provider.id === slot.physicianId)!) : undefined }))} /> : <p role="status">{CLINICAL_COPY.noTimes}</p>}</div>
  </div></div>;
}
