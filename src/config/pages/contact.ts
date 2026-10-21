// Shared contact and FAQ fixtures: no secure submission or unconfirmed email address.
import { mockPage } from "@/config/pages/helpers";
import { FAQ } from "@/config/home-content";
import type { FaqGroup } from "@/types/public";
export const CONTACT_PAGE = mockPage("/contact", "Contact", "Let’s start with", "a conversation.", "Practice locations, hours and phone details are provisional and require confirmation before launch.");
export const CONTACT_COPY = {
  phone: "Call the practice", fax: "Fax", email: "Email the practice", emailPending: "[PRACTICE EMAIL: awaiting confirmation]",
  locations: "Practice locations", locationSelector: "Choose a provisional location", hours: "Hours", parking: "Parking", accessibility: "Accessibility",
  formHeading: "Send an enquiry", formUnavailable: "Online enquiries are not available yet. Please call the practice.",
  name: "Your name", emailField: "Email address", message: "Your message", messageHint: "Please do not include health or other sensitive information.", submit: "Send enquiry",
};
export const FAQ_PAGE = mockPage("/faq", "Frequently asked questions", "Questions before", "your visit?", "[FAQ INTRODUCTION: Hamidah’s approved questions and answers to follow]");
export const FAQ_GROUPS: FaqGroup[] = [
  { id: "appointments", title: "Appointments", items: [FAQ.questions[0], FAQ.questions[4]] },
  { id: "visiting", title: "Your visit", items: [FAQ.questions[2], FAQ.questions[3]] },
  { id: "coverage", title: "Insurance and coverage", items: [FAQ.questions[1]] },
];
