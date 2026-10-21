// Client presentation: locally reviewed details never enter URLs, notifications or logs.
"use client";
import type { BookingCopy } from "@/config/booking-copy";
import type { BookingState, BookingSettings, MockSchedule } from "@/types/booking";
import type { PracticeLocation } from "@/types/public";
import { formatDay, formatTime } from "@/features/booking/time";
export default function BookingSummary({ state, settings, schedule, locations, copy, contact = false }: {
  state: BookingState; settings: BookingSettings; schedule: MockSchedule; locations: PracticeLocation[]; copy: BookingCopy; contact?: boolean;
}) {
  const slot = schedule.slots.find((item) => item.id === state.selection.slotId);
  const rows = [
    [copy.selectionType, settings.types.find((type) => type.id === state.selection.typeId)?.label],
    [copy.selectionProvider, settings.providers.find((provider) => provider.id === slot?.providerId)?.label],
    [copy.selectionLocation, locations.find((location) => location.id === state.selection.locationId)?.label],
    [copy.selectionDate, state.selection.dateId ? formatDay(state.selection.dateId, settings.timeZone, settings.locale) : ""],
    [copy.selectionTime, slot ? formatTime(slot.startUtc, settings.timeZone, settings.locale) : ""],
  ];
  if (contact) rows.push([copy.name, state.details.name], [copy.phone, state.details.phone], [copy.email, state.details.email],
    [copy.dateOfBirth, state.details.dateOfBirth], [copy.reason, state.details.reason],
    [copy.selectionSms, state.details.smsConsent ? copy.yes : copy.no], [copy.selectionEmail, state.details.emailConsent ? copy.yes : copy.no]);
  return <dl className="booking-summary">{rows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>;
}
