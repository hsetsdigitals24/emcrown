// Shared pure availability: local hours become UTC instants; ambiguous/nonexistent DST times are skipped.
import { BUSINESS_HOURS } from "@/config/business-hours";
import { localTimeToUtc } from "@/features/booking/zoned-time";
import type { AvailabilitySlot, ProviderSchedule } from "@/types/clinical";
import { BOOKING_SETTINGS } from "@/config/booking";
import { CLINICAL_POLICY } from "@/config/clinical";
export function wallToUtc(day: string, clock: string): Date | null {
  return localTimeToUtc(day, clock, BOOKING_SETTINGS.timeZone);
}
export type BusyTime = { physicianId: string; startAt: Date; occupiedUntil: Date };
export function buildSlots(definitions: ProviderSchedule[], busy: BusyTime[], from: string, days: number, now = new Date()): AvailabilitySlot[] {
  const slots = new Map<string, AvailabilitySlot>();
  const closures = new Map<string, { dates: string[]; times: ProviderSchedule["blockedTimes"] }>();
  for (const definition of definitions.filter(item => item.enabled)) {
    const existing = closures.get(definition.physicianId) ?? { dates: [], times: [] };
    existing.dates.push(...definition.blockedDates); existing.times.push(...(definition.blockedTimes ?? []));
    closures.set(definition.physicianId, existing);
  }
  const count = Math.max(0, Math.min(days, CLINICAL_POLICY.horizonDays));
  for (let offset = 0; offset < count; offset++) {
    const day = new Date(`${from}T12:00:00Z`); day.setUTCDate(day.getUTCDate() + offset);
    const dateId = day.toISOString().slice(0, 10);
    if (!BUSINESS_HOURS.weekdays.includes(day.getUTCDay())) continue;
    for (const definition of definitions) {
      if (!definition.enabled || definition.weekday !== day.getUTCDay() || closures.get(definition.physicianId)?.dates.includes(dateId)) continue;
      addDaySlots(slots, { ...definition, blockedTimes: closures.get(definition.physicianId)?.times ?? [] }, busy, dateId, now);
    }
  }
  return [...slots.values()].sort((a, b) => a.startUtc.localeCompare(b.startUtc));
}
function addDaySlots(slots: Map<string, AvailabilitySlot>, d: ProviderSchedule, busy: BusyTime[], day: string, now: Date) {
  const minutes = (clock: string) => Number(clock.slice(0, 2)) * 60 + Number(clock.slice(3));
  const closeMinute = Math.min(minutes(d.closes), BUSINESS_HOURS.closes);
  const close = wallToUtc(day, `${String(Math.floor(closeMinute / 60)).padStart(2, "0")}:${String(closeMinute % 60).padStart(2, "0")}`); if (!close) return;
  for (let minute = Math.max(minutes(d.opens), BUSINESS_HOURS.opens); minute + d.durationMinutes + d.bufferMinutes <= closeMinute; minute += d.intervalMinutes) {
    if ((d.blockedTimes ?? []).some(block => block.date === day && minutes(block.start) < minute + d.durationMinutes + d.bufferMinutes && minutes(block.end) > minute)) continue;
    const start = wallToUtc(day, `${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`);
    if (!start || start.getTime() < now.getTime() + d.leadHours * 3600000) continue;
    const end = new Date(start.getTime() + d.durationMinutes * 60000);
    const occupied = new Date(end.getTime() + d.bufferMinutes * 60000);
    if (occupied > close || busy.some(item => item.physicianId === d.physicianId && item.startAt < occupied && item.occupiedUntil > start)) continue;
    slots.set([d.physicianId, d.locationId, d.typeId, start.toISOString()].join(":"), {
      physicianId: d.physicianId, locationId: d.locationId, typeId: d.typeId, startUtc: start.toISOString(), endUtc: end.toISOString(), bufferMinutes: d.bufferMinutes,
    });
  }
}
