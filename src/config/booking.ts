// Shared proposed demo settings; office-manager configuration has not been supplied.
import type { BookingSettings } from "@/types/booking";
import { PHYSICIAN_ENTRIES } from "@/config/pages/catalogs";
import { PRACTICE } from "@/config/practice";
const PROVIDERS = PHYSICIAN_ENTRIES.map((entry, index) => ({ id: entry.slug, label: `[PHYSICIAN ${index + 1}: NAME PENDING]`, specialty: entry.specialty }));
export const BOOKING_SETTINGS: BookingSettings = {
  timeZone: "America/New_York", locale: "en-US", providers: PROVIDERS,
  firstAvailableId: "first-available", locationIds: PRACTICE.locations.map((location) => location.id), defaultLocationId: PRACTICE.locations[0].id,
  types: [
    { id: "new-patient", label: "New patient", description: "[NEW PATIENT VISIT: instructions and duration awaiting approval]", durationMinutes: 30, leadHours: 24, providerIds: PROVIDERS.map((provider) => provider.id) },
    { id: "follow-up", label: "Follow up", description: "[FOLLOW UP VISIT: instructions and duration awaiting approval]", durationMinutes: 20, leadHours: 12, providerIds: PROVIDERS.slice(0, 2).map((provider) => provider.id) },
    { id: "urgent", label: "Urgent", description: "[URGENT VISIT: appointment routing awaiting approval. This is only a demo.]", durationMinutes: 15, leadHours: 2, providerIds: PROVIDERS.slice(1).map((provider) => provider.id) },
  ],
  dayOffsets: Array.from({ length: 21 }, (_, index) => index),
  unavailableOffset: 4, errorOffset: 6, delayMs: 350, confirmationFails: false,
  reasonLimit: 300, nameLimit: 100,
};
