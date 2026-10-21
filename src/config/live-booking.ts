// Shared live-booking copy reuses form slots while keeping demonstration language out of real submissions.
import { BOOKING_COPY } from "@/config/booking-copy";
import { CLINICAL_COPY as c } from "@/config/clinical";
export const LIVE_BOOKING_COPY = { ...BOOKING_COPY,
  reasonHint: "Brief, general wording only. Do not enter diagnoses, insurance IDs or medical history.",
  smsConsent: c.smsConsent, emailConsent: c.emailConsent, consentHint: "Reminder choices are optional. Declining reminders does not prevent booking.",
  errors: { ...BOOKING_COPY.errors, nameRequired: "Enter your full name within the allowed length.", phoneInvalid: "Enter a valid phone number with 10–15 digits.",
    emailInvalid: "Enter a valid email address.", reasonRequired: "Enter a short reason within the allowed length." },
};
