// Shared live-booking copy reuses form slots while keeping demonstration language out of real submissions.
import { BOOKING_COPY } from "@/config/booking-copy";
import { CLINICAL_COPY as c } from "@/config/clinical";
export const BOOKING_REVIEW_COPY = {
  title: "Engineering review",
  notice: "Engineering review: this form saves real test appointments in the admin inbox and queues test emails. Use fictional patient details and a configured reviewer email address. Do not enter real patient information. SMS is disabled.",
  complete: "Test booking saved",
  completeBody: "Your test request is saved in the admin appointment inbox. Test emails are queued for delivery to enabled reviewer mailboxes.",
};
export const LIVE_BOOKING_COPY = { ...BOOKING_COPY,
  introduction: "Choose a visit and an available time. The practice will review your appointment request.",
  noScript: "Online booking needs JavaScript. Please contact the practice if you need help arranging an appointment.",
  steps: [
    { ...BOOKING_COPY.steps[0], body: "Choose the appointment type for your visit." },
    { ...BOOKING_COPY.steps[1], body: "Choose a physician or see the first available appointment." },
    { ...BOOKING_COPY.steps[2], body: "Choose from the available dates and times below. Times are shown in the practice’s time zone." },
    { ...BOOKING_COPY.steps[3], body: "Enter your contact details, then review your appointment request before submitting." },
  ],
  firstAvailableDescription: "See available appointments across eligible physicians.",
  reviewTitle: "Review your", reviewHighlight: "appointment request.",
  reviewBody: "Check your visit, time and contact details. Submit your request when everything looks right.",
  completionTitle: "Request received.", completionHighlight: "Thank you.", completionBody: c.bookedBody,
  review: "Review appointment", confirm: "Request appointment", reset: "Request another appointment",
  reasonHint: "Brief, general wording only. Do not enter diagnoses, insurance IDs or medical history.",
  smsConsent: c.smsConsent, emailConsent: c.emailConsent, consentHint: "Reminder choices are optional. Declining reminders does not prevent booking.",
  errors: { ...BOOKING_COPY.errors, nameRequired: "Enter your full name within the allowed length.", phoneInvalid: "Enter a valid phone number with 10–15 digits.",
    emailInvalid: "Enter a valid email address.", reasonRequired: "Enter a short reason within the allowed length." },
};
