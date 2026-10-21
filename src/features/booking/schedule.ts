// Shared mock fixture generator and filter: no booking writes or actual reservations.
import { BUSINESS_HOURS } from "@/config/business-hours";
import { localTimeToUtc } from "@/features/booking/zoned-time";
import type { BookingSettings, BookingSelection, MockSchedule, MockSlot } from "@/types/booking";
import { practiceDate } from "@/features/booking/time";
export function makeMockSchedule(referenceUtc: string, settings: BookingSettings, locationIds: string[]): MockSchedule {
  const today = practiceDate(referenceUtc, settings.timeZone);
  const days = settings.dayOffsets.map((offset) => {
    const date = new Date(`${today}T14:00:00Z`);
    date.setUTCDate(date.getUTCDate() + offset);
    return { id: practiceDate(date.toISOString(), settings.timeZone), scenario: !BUSINESS_HOURS.weekdays.includes(date.getUTCDay()) || offset === settings.unavailableOffset ? "unavailable" as const : offset === settings.errorOffset ? "error" as const : "ready" as const };
  });
  const slots: MockSlot[] = [];
  for (const day of days) {
    if (day.scenario === "unavailable") continue;
    for (let minute = BUSINESS_HOURS.opens; minute < BUSINESS_HOURS.closes; minute += BUSINESS_HOURS.slotIntervalMinutes) {
      const start = localTimeToUtc(day.id, `${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`, settings.timeZone);
      if (!start) continue;
      for (const locationId of locationIds) for (const provider of settings.providers) {
        slots.push({ id: `${day.id}-${locationId}-${provider.id}-${minute}`, dateId: day.id, providerId: provider.id, locationId, startUtc: start.toISOString() });
      }
    }
  }
  return { referenceUtc, days, slots };
}
export function availableMockSlots(schedule: MockSchedule, settings: BookingSettings, selection: BookingSelection): MockSlot[] {
  const type = settings.types.find((item) => item.id === selection.typeId);
  if (!type || schedule.days.find((day) => day.id === selection.dateId)?.scenario === "unavailable") return [];
  const bounds = businessBounds(selection.dateId, settings.timeZone);
  if (!bounds) return [];
  const earliest = Math.max(Date.parse(schedule.referenceUtc) + type.leadHours * 3600000, bounds.open);
  const slots = schedule.slots.filter((slot) => slot.dateId === selection.dateId && slot.locationId === selection.locationId
    && type.providerIds.includes(slot.providerId) && (selection.providerId === settings.firstAvailableId || selection.providerId === slot.providerId)
    && Date.parse(slot.startUtc) >= earliest && Date.parse(slot.startUtc) + type.durationMinutes * 60000 <= bounds.close).sort((first, second) => first.startUtc.localeCompare(second.startUtc) || first.providerId.localeCompare(second.providerId));
  // First available collapses simultaneous times to a deterministic eligible physician.
  return selection.providerId === settings.firstAvailableId ? slots.filter((slot, index) => slots.findIndex((item) => item.startUtc === slot.startUtc) === index) : slots;
}

// Date-specific boundaries are computed once per availability query, including DST offsets.
function businessBounds(day: string, timeZone: string): { open: number; close: number } | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !BUSINESS_HOURS.weekdays.includes(new Date(`${day}T12:00:00Z`).getUTCDay())) return null;
  const clock = (minutes: number) => `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
  const open = localTimeToUtc(day, clock(BUSINESS_HOURS.opens), timeZone);
  const close = localTimeToUtc(day, clock(BUSINESS_HOURS.closes), timeZone);
  return open && close ? { open: open.getTime(), close: close.getTime() } : null;
}
export function fitsBusinessHours(startUtc: string, durationMinutes: number, timeZone: string): boolean {
  const bounds = businessBounds(practiceDate(startUtc, timeZone), timeZone);
  return !!bounds && Date.parse(startUtc) >= bounds.open && Date.parse(startUtc) + durationMinutes * 60000 <= bounds.close;
}
