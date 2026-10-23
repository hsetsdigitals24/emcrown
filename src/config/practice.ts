// Shared configuration: provisional contact details and two switchable reference locations.
import { BUSINESS_HOURS } from "@/config/business-hours";
import type { PracticeConfig } from "@/types/public";
export const PRACTICE: PracticeConfig = {
  phone: { label: "+1 (772) 261 8316", href: "tel:+17722618316" },
  fax: "+1 772 205 3766", email: null, locationSelectorEnabled: true,
  locations: [
    { id: "stuart", label: "Stuart — confirm before travelling", address: "2309 NW Federal Highway, Stuart, FL 34994",
      hours: BUSINESS_HOURS.label, parking: "Free parking", accessibility: "ADA accessible",
      mapLabel: "Stuart reference location. Confirm your appointment address before travelling.",
      directions: { label: "Get directions", href: "https://www.google.com/maps/search/?api=1&query=2309%20NW%20Federal%20Highway%20Stuart%20FL%2034994" } },
    { id: "jensen-beach", label: "Jensen Beach — confirm before travelling", address: "3601 NW Federal Hwy, Jensen Beach, FL 34957",
      hours: BUSINESS_HOURS.label, parking: "Free parking", accessibility: "ADA accessible",
      mapLabel: "Jensen Beach reference location. Confirm your appointment address before travelling.",
      directions: { label: "Get directions", href: "https://www.google.com/maps/search/?api=1&query=3601%20NW%20Federal%20Hwy%20Jensen%20Beach%20FL%2034957" } },
  ],
};
export const SITE_SETTINGS = { url: "https://emcrownphysicians.com", indexingEnabled: false };
