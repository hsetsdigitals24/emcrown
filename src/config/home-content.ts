// Shared draft CMS-shaped blocks: editorial mock copy and explicit factual placeholders.
import { PRACTICE } from "@/config/practice";
import type { HomeBlock, BookingStepsContent, HeroContent, PhysicianContent, TestimonialsContent, LocationContent, FaqContent } from "@/types/home";
function block(id: string, eyebrow: string, headline: string, highlightedPhrase: string, body = ""): HomeBlock {
  return { id, status: "draft", isMock: true, eyebrow, headline, highlightedPhrase,
    subheading: "", body, buttonLabel: "", buttonLink: "", items: [] };
}
export const HERO: HeroContent = {
  ...block("home", "EMCROWN PHYSICIAN SERVICES", "Your health. Your story.", "Our focus.",
    "Get to know our practice, explore our physicians, and take the next step toward your appointment."),
  buttonLabel: "Book appointment", buttonLink: "/book",
  secondary: { label: "Call us", href: PRACTICE.phone.href },
  photoLabel: "Stock consultation imagery; not Emcrown staff or patients",
  media: { poster: "/media/hero-consultation.jpg", photo: "/media/hero-care.jpg", video: "/media/hero-consultation.mp4",
    label: "Demo stock imagery • Not Emcrown staff or patients", pauseLabel: "Pause hero video", playLabel: "Play hero video" },
  chip: "[PRACTICE CREDENTIAL]", imageCaption: "A space for your next chapter.",
  notice: "Preview • Draft copy and practice details awaiting client approval.",
  items: [
    { id: "trust-1", title: "Free parking", description: "" },
    { id: "trust-2", title: "ADA accessible", description: "" },
    { id: "trust-3", title: "[CONFIRMED PRACTICE DETAIL]", description: "" },
  ],
};
export const PRINCIPLES: HomeBlock = {
  ...block("about", "A DIFFERENT KIND OF CONNECTION", "Care begins with", "a conversation.",
    "[PRACTICE MISSION: awaiting approved client copy]"),
  items: [
    { id: "principle-1", title: "Space to be heard", description: "[PRINCIPLE 01: how the practice listens to patients]" },
    { id: "principle-2", title: "Clarity at every step", description: "[PRINCIPLE 02: the practice’s approach to communication]" },
    { id: "principle-3", title: "A relationship that matters", description: "[PRINCIPLE 03: the practice’s approach to ongoing care]" },
  ],
};
export const SERVICES: HomeBlock = {
  ...block("services", "WHAT WE TREAT", "Care that fits", "your life.",
    "[SERVICE INTRODUCTION: the client’s services list is still to be confirmed]"),
  items: Array.from({ length: 6 }, (_, index) => ({ id: `service-${index + 1}`,
    title: `[SERVICE NAME ${String(index + 1).padStart(2, "0")}]`,
    description: "[SERVICE DESCRIPTION: conditions and care offered, awaiting approval]",
    tags: ["[SERVICE CATEGORY]"], link: { label: "Learn more", href: `/services/service-${index + 1}` },
  })),
};
export const BOOKING: BookingStepsContent = {
  ...block("booking", "YOUR NEXT STEP", "A simpler path to", "your appointment.",
    "[BOOKING INTRODUCTION: online appointment booking is being prepared]"),
  buttonLabel: "Book an appointment", buttonLink: "/physicians",
  background: { images: ["/media/hero-consultation.jpg", "/media/hero-care.jpg"], label: "Demo stock imagery • Not Emcrown staff or patients" },
  items: [
    { id: "step-1", title: "Choose a visit", description: "[STEP 01: appointment types will be confirmed by the practice]" },
    { id: "step-2", title: "Pick a time", description: "[STEP 02: provider availability and time slots will be configured]" },
    { id: "step-3", title: "Get confirmation", description: "[STEP 03: confirmation and reminder settings will be configured]" },
  ],
};
export const PHYSICIANS: PhysicianContent = {
  ...block("physicians", "MEET YOUR PHYSICIANS", "The people behind", "your care.",
    "[PHYSICIAN INTRODUCTION: approved biographies and credentials to follow]"),
  physicians: Array.from({ length: 3 }, (_, index) => ({ id: `physician-${index + 1}`,
    name: "Dr. [PHYSICIAN NAME]", specialty: "[SPECIALTY]",
    photoLabel: `[PHOTO PLACEHOLDER: physician ${index + 1} portrait]`,
    link: { label: "Book with Dr. [NAME]", href: "/book" },
  })),
};
export const TESTIMONIALS: TestimonialsContent = {
  ...block("testimonials", "PATIENT PERSPECTIVES", "Every story", "matters.",
    "Patient stories will appear here only with written permission."),
  controls: { autoplayMs: 5000, pause: "Pause testimonials", play: "Play testimonials", label: "Patient perspectives", roleDescription: "slideshow", previous: "Previous testimonial", next: "Next testimonial", goTo: "Go to testimonial", slide: "Testimonial", of: "of" },
  testimonials: Array.from({ length: 3 }, (_, index) => ({ id: `testimonial-${index + 1}`,
    quote: "[PATIENT TESTIMONIAL: awaiting written consent and approved wording]",
    attribution: "[APPROVED ATTRIBUTION]", label: "TESTIMONIAL PLACEHOLDER",
  })),
};
export const INSURANCE: HomeBlock = {
  ...block("insurance", "PLANNING YOUR VISIT", "Let’s talk about", "coverage.",
    "Accepted insurance information is coming soon. Contact the practice to discuss your visit, and check your benefits directly with your insurer."),
  subheading: "Coming soon", buttonLabel: "Call about your visit", buttonLink: PRACTICE.phone.href,
};
export const LOCATION: LocationContent = {
  ...block("contact", "FIND US", "Your next visit", "starts here.",
    "Practice address, contact details and hours below are provisional and require verification before launch."),
  mapLabel: "[MAP PLACEHOLDER: verified practice location to follow]",
  address: PRACTICE.locations[0].address,
  phone: PRACTICE.phone,
  hours: PRACTICE.locations[0].hours, detailsLabel: "PROVISIONAL PRACTICE DETAILS",
  badges: ["Free parking", "ADA accessible"],
  directions: { label: "Get directions", href: "https://www.google.com/maps/search/?api=1&query=2309%20NW%20Federal%20Highway%20Stuart%20FL%2034994" },
};
export const FAQ: FaqContent = {
  ...block("faq", "A LITTLE MORE CLARITY", "Questions before", "your visit?"),
  questions: [
    { id: "faq-1", question: "How can I request an appointment?", answer: "The online booking flow is being prepared. For this preview, use the Call us link to contact the practice. Contact details are provisional until verified." },
    { id: "faq-2", question: "Which insurance plans do you accept?", answer: "An accepted insurance list is not yet available. Please contact the practice and your insurer to confirm coverage before your visit." },
    { id: "faq-3", question: "What should I bring to my first visit?", answer: "[FIRST VISIT GUIDANCE: awaiting the practice’s approved instructions]" },
    { id: "faq-4", question: "Is parking available?", answer: "The client has confirmed free parking and ADA accessibility. Location-specific directions will be confirmed before launch." },
    { id: "faq-5", question: "How do I cancel or reschedule?", answer: "[CANCELLATION AND RESCHEDULING POLICY: awaiting client decision]" },
  ],
};
export const CLOSING: HomeBlock = {
  ...block("next-step", "HERE FOR YOUR NEXT CHAPTER", "Make room for", "your health.",
    "Your next step starts with a conversation. Get in touch with Emcrown Physician Services."),
  buttonLabel: "Book appointment", buttonLink: "/book",
};
export const HOME_METADATA = {
  title: "Emcrown Physician Services | Your next step in care",
  description: "Explore Emcrown Physician Services, physician information, visit details and appointment options in Florida.",
  canonical: "https://emcrownphysicians.com",
};
