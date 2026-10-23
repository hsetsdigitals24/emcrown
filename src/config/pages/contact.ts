// Shared contact and FAQ fixtures: no secure submission or unconfirmed email address.
import { mockPage } from "@/config/pages/helpers";
import { FAQ } from "@/config/home-content";
import type { FaqGroup } from "@/types/public";
export const CONTACT_PAGE = mockPage("/contact", "Contact", "Let’s start with", "a conversation.", "Have a question about visiting Emcrown Physician Services? Call to discuss appointments, directions or practical arrangements. Please confirm your appointment location before you travel.");
export const CONTACT_COPY = {
  phone: "Call the practice", fax: "Fax", email: "Email the practice", emailPending: "Please call the practice for the right contact route. Do not send personal medical information through general email.",
  locations: "Practice locations", locationSelector: "Explore the locations below. Please confirm which location applies to your appointment.", hours: "Hours", parking: "Parking", accessibility: "Accessibility",
  formHeading: "Send an enquiry", formUnavailable: "Online enquiries are not available yet. Please call the practice.",
  name: "Your name", emailField: "Email address", message: "Your message", messageHint: "Please do not include health or other sensitive information.", submit: "Send enquiry",
};
export const FAQ_PAGE = mockPage("/faq", "Frequently asked questions", "Questions before", "your visit?", "Find practical answers about appointments, preparing for a visit, insurance and getting here. If your question is not covered, call the practice before you travel.");
export const FAQ_GROUPS: FaqGroup[] = [
  { id: "appointments", title: "Appointments", items: [FAQ.questions[0], FAQ.questions[4]] },
  { id: "visiting", title: "Your visit", items: [FAQ.questions[2], FAQ.questions[3]] },
  { id: "coverage", title: "Insurance and coverage", items: [FAQ.questions[1]] },
];
