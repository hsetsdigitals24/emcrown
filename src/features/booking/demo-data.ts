// Server-only use by the route: cache public mock schedule data, never contact input.
import "server-only";
import { unstable_cache } from "next/cache";
import { BOOKING_SETTINGS } from "@/config/booking";
import { PRACTICE } from "@/config/practice";
import { makeMockSchedule } from "@/features/booking/schedule";
export const getDemoSchedule = unstable_cache(async () => {
  return makeMockSchedule(new Date().toISOString(), BOOKING_SETTINGS, PRACTICE.locations.map((location) => location.id));
}, ["public-demo-schedule-office-hours-v2"], { revalidate: 3600 });
