// Shared configuration: provisional contact details and one editable reference location.
import { BUSINESS_HOURS } from "@/config/business-hours";
import type { PracticeConfig } from "@/types/public";
export const PRACTICE: PracticeConfig = {
  phone: { label: "+1 (772) 261 8316", href: "tel:+17722618316" },
  fax: "+1 772 205 3766", email: null, locationSelectorEnabled: false,
  locations: [
    { id: "stuart", label: "Stuart — confirm before travelling", address: "2309 NW Federal Highway, Stuart, FL 34994",
      hours: BUSINESS_HOURS.label, parking: "Free parking", accessibility: "ADA accessible",
      mapLabel: "Stuart reference location. Confirm your appointment address before travelling.",
      directions: { label: "Get directions", href: "https://www.google.com/maps/search/?api=1&query=2309%20NW%20Federal%20Highway%20Stuart%20FL%2034994" } },

  ],
};
// Retain old schedule IDs for historical reads; they cannot accept new enabled schedules.
export const RETIRED_LOCATION_IDS = ["jensen-beach"] as const;
export const SITE_SETTINGS = { url: "https://emcrownphysicians.com", indexingEnabled: false };
