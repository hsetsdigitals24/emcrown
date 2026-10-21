// Client component: configured mock dates and UTC slots, displayed in the practice zone.
"use client";
import BookingCalendar from "@/features/booking/BookingCalendar";
import BookingTimes from "@/features/booking/BookingTimes";
import { BUSINESS_HOURS } from "@/config/business-hours";
import { availableMockSlots } from "@/features/booking/schedule";
import { practiceDate, formatTime } from "@/features/booking/time";
import type { AvailabilityState, BookingSelection, BookingSettings, MockSchedule } from "@/types/booking";
import type { BookingCopy } from "@/config/booking-copy";
export default function DateTimeStep({ schedule, settings, selection, availability, copy, onDate, onSlot, onRetry }: {
  schedule: MockSchedule; settings: BookingSettings; selection: BookingSelection; availability: AvailabilityState; copy: BookingCopy;
  onDate: (id: string) => void; onSlot: (id: string) => void; onRetry: () => void;
}) {
  const dates = schedule.days.filter(day => availableMockSlots(schedule, settings, { ...selection, dateId: day.id }).length > 0).map(day => day.id);
  const times = availability.slots.map((slot) => ({ id: slot.id, label: formatTime(slot.startUtc, settings.timeZone, settings.locale),
    description: settings.providers.find((provider) => provider.id === slot.providerId)?.label }));
  return <div className="space-y-6"><p className="booking-hours">{BUSINESS_HOURS.label}<span>{copy.timeZone} {settings.timeZone}</span></p>
    <div className="booking-date-time">
    <BookingCalendar dates={dates} value={selection.dateId} onChange={onDate} referenceDate={practiceDate(schedule.referenceUtc, settings.timeZone)} timeZone={settings.timeZone} locale={settings.locale} label={copy.dates} />
    <div className="booking-time-panel">
    <div aria-live="polite" aria-busy={availability.status === "loading"} className="availability-status">
      {availability.status === "idle" && <p>{dates.length ? copy.chooseDate : copy.unavailable}</p>}{availability.status === "loading" && <p role="status">{copy.loading}</p>}
      {availability.status === "unavailable" && <p>{copy.unavailable}</p>}
      {availability.status === "error" && <div role="alert"><p>{copy.loadError}</p><button type="button" className="recovery-link mt-4" onClick={onRetry}>{copy.retry}</button></div>}
    </div>
    {availability.status === "ready" && <BookingTimes label={copy.times} options={times} value={selection.slotId} onChange={onSlot} />}
    </div></div>
  </div>;
}
