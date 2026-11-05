// Shared public appointment-management copy; cutoff stays tied to clinical policy.
import { CLINICAL_POLICY } from "@/config/clinical";
export const MANAGE_COPY = {
  eyebrow: "Your visit, your next step", headline: "Manage your", highlight: "appointment.",
  intro: `Review your visit, choose a new time or cancel. Online changes close ${CLINICAL_POLICY.cancellationHours} hours before your appointment.`,
  secure: "Secure appointment access", loading: "Finding your appointment…", help: "Let’s get you back on track",
  problem: "We couldn’t open this appointment", retry: "Try again", contact: "Contact the practice", home: "Back to home",
  missing: "Open the complete secure link from your latest appointment email to manage your visit.",
  noScript: "JavaScript is needed to open your secure appointment link. Enable JavaScript or contact the practice for help.",
  unavailable: "We couldn’t connect to the appointment service. Please try again shortly.",
  linkHelp: "Each update replaces the previous link. Reopening or refreshing this page requires the complete link from your latest email.",
  savedLabel: "Change recorded", saved: "Check your email for the appointment update. If you rescheduled, use the new link for any further changes.",
  current: "Your current appointment", privacy: "Your contact details and reason for visiting stay private and are not displayed here.",
  change: "Find a time that works for you", changeHelp: "Choose an available date and time with the same physician. Your current time stays reserved until you save the change.",
  save: "Save new appointment time", cancelTitle: "Need to cancel your visit?", cancelHelp: "Cancelling releases this time. Contact the practice if you need help arranging another visit.",
};
