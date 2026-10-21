// Focused office-hour/calendar regression checks: no database, service calls or patient data.
/* eslint-disable @typescript-eslint/no-require-imports -- Reuse the repository TypeScript loader. */
require("../scripts/auth.cjs");
const assert = require("node:assert/strict");
const { BOOKING_SETTINGS } = require("../src/config/booking.ts");
const { makeMockSchedule, availableMockSlots, fitsBusinessHours } = require("../src/features/booking/schedule.ts");
const { calendarCells, shiftMonth } = require("../src/features/booking/calendar.ts");
const { buildSlots } = require("../src/features/appointments/slots.ts");
const zone = BOOKING_SETTINGS.timeZone;
assert.equal(fitsBusinessHours("2026-10-23T13:00:00Z", 30, zone), true);
assert.equal(fitsBusinessHours("2026-10-23T12:30:00Z", 30, zone), false);
assert.equal(fitsBusinessHours("2026-10-23T20:30:00Z", 30, zone), true);
assert.equal(fitsBusinessHours("2026-10-23T20:30:00Z", 45, zone), false);
assert.equal(fitsBusinessHours("2026-10-24T13:00:00Z", 30, zone), false);
assert.equal(fitsBusinessHours("2026-11-02T14:00:00Z", 30, zone), true);
assert.equal(fitsBusinessHours("2026-11-02T13:30:00Z", 30, zone), false);
const rule = { physicianId:"fixture", locationId:"stuart", typeId:"new-patient", weekday:1, opens:"07:00",closes:"20:00",intervalMinutes:30,durationMinutes:30,bufferMinutes:0,leadHours:0,blockedDates:[],blockedTimes:[],enabled:true };
const now = new Date("2026-10-01T00:00:00Z");
for (const [date, open, close] of [["2026-10-26","2026-10-26T13:00:00.000Z","2026-10-26T21:00:00.000Z"],["2026-11-02","2026-11-02T14:00:00.000Z","2026-11-02T22:00:00.000Z"]]) {
  const slots = buildSlots([rule], [], date, 1, now);
  assert.equal(slots.length,16); assert.equal(slots[0].startUtc,open); assert.equal(slots.at(-1).endUtc,close);
  const longer = buildSlots([{...rule,durationMinutes:45,bufferMinutes:15}], [], date, 1, now);
  assert.ok(longer.every(slot => Date.parse(slot.endUtc) + 15 * 60000 <= Date.parse(close)));
}
assert.equal(buildSlots([{...rule,weekday:6}],[],"2026-10-24",1,now).length,0);
const mock = makeMockSchedule("2026-10-21T12:00:00Z",BOOKING_SETTINGS,BOOKING_SETTINGS.locationIds);
assert.ok(mock.slots.length);
assert.ok(mock.slots.every(slot => fitsBusinessHours(slot.startUtc, 30, zone)));
const selection = {typeId:"new-patient",providerId:BOOKING_SETTINGS.firstAvailableId,locationId:BOOKING_SETTINGS.defaultLocationId,dateId:"2026-10-23",slotId:""};
assert.equal(availableMockSlots(mock,BOOKING_SETTINGS,selection).length,16);
assert.equal(calendarCells("2028-02").filter(day=>day.current).length,29);
assert.equal(calendarCells("2026-02").filter(day=>day.current).length,28);
assert.equal(calendarCells("2026-10").length,42);
assert.equal(shiftMonth("2026-12",1),"2027-01");
assert.equal(shiftMonth("2027-01",-1),"2026-12");
console.log("Passed: weekday/office-hour bounds, winter/summer offsets, closing durations/buffers, demo slots, leap years and month navigation.");
