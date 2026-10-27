// Shared draft CMS-shaped blocks: editorial mock copy and explicit factual placeholders.
import { SERVICE_ENTRIES } from "@/config/pages/service-guides";
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
    label: "Stock imagery • Not Emcrown staff or patients", pauseLabel: "Pause hero video", playLabel: "Play hero video" },
  chip: "Start with a conversation", imageCaption: "A space for your next chapter.",
  notice: "",
  items: [
    { id: "trust-1", title: "Free parking", description: "" },
    { id: "trust-2", title: "ADA accessible", description: "" },
    { id: "trust-3", title: "Get to know your physician", description: "" },
  ],
};
export const PRINCIPLES: HomeBlock = {
  ...block("about", "A DIFFERENT KIND OF CONNECTION", "Care begins with", "a conversation.",
    "Your questions, priorities and day-to-day life belong in the conversation about your health. Get to know Emcrown Physician Services and explore the information that helps you feel prepared for a visit."),
  items: [
    { id: "principle-1", title: "Space to be heard", description: "Begin with the question that matters most to you. We believe your perspective belongs at the centre of the conversation." },
    { id: "principle-2", title: "Clarity at every step", description: "Ask what a term means, what an option involves and what happens next. Understanding is part of feeling prepared." },
    { id: "principle-3", title: "A relationship that matters", description: "Get to know your physician and bring your priorities into the discussion, whether you are arranging a first visit or planning a follow-up." },
  ],
};
export const SERVICES: HomeBlock = {
  ...block("services", "PLAN YOUR VISIT", "Care that fits", "your life.",
    "Explore practical guides to choosing a physician, preparing for a visit and managing appointments. Contact the practice to confirm which clinical services are available for your needs."),
  items: SERVICE_ENTRIES.map((entry, index) => ({ id: `service-${index + 1}`,
    title: entry.title, description: entry.hero.body, tags: entry.tags,
    image: { src: `/media/visit-guide-${index + 1}.webp`, label: "Illustrative image • Not Emcrown staff or premises" },
    link: { label: "Explore this guide", href: entry.path },
  })),
};
export const BOOKING: BookingStepsContent = {
  ...block("booking", "YOUR NEXT STEP", "A simpler path to", "your appointment.",
    "Start by getting to know our physicians and checking the practical details. The appointment page currently offers a demonstration; call the practice to arrange an actual visit."),
  buttonLabel: "Meet our physicians", buttonLink: "/physicians",
  background: { images: ["/media/hero-consultation.jpg", "/media/hero-care.jpg"], label: "Stock imagery • Not Emcrown staff or patients" },
  items: [
    { id: "step-1", title: "Explore your options", description: "Read the physician profiles and ask whether the practice can help with the concern you want to discuss." },
    { id: "step-2", title: "Check the details", description: "Confirm the physician, location, availability and any coverage requirements before arranging your appointment." },
    { id: "step-3", title: "Know what comes next", description: "Follow the practice’s appointment instructions and ask what you need to bring. The website demo does not reserve a visit." },
  ],
};
export const PHYSICIANS: PhysicianContent = {
  ...block("physicians", "MEET YOUR PHYSICIANS", "The people behind", "your care.",
    "A name is just the beginning. Explore our published profiles to learn more about the physicians you may see, then contact the practice with any questions about arranging a visit."),
  physicians: [],
};
export const TESTIMONIALS: TestimonialsContent = {
  ...block("testimonials", "PATIENT PERSPECTIVES", "Every story", "matters.",
    "Patient stories will appear here only with written permission."),
  controls: { autoplayMs: 5000, pause: "Pause testimonials", play: "Play testimonials", label: "Patient perspectives", roleDescription: "slideshow", previous: "Previous testimonial", next: "Next testimonial", goTo: "Go to testimonial", slide: "Testimonial", of: "of" },
  testimonials: Array.from({ length: 3 }, (_, index) => ({ id: `testimonial-${index + 1}`,
    quote: "",
    attribution: "", label: "",
  })),
};
export const INSURANCE: HomeBlock = {
  ...block("insurance", "PLANNING YOUR VISIT", "Let’s talk about", "coverage.",
    "Accepted insurance information is coming soon. Contact the practice to discuss your visit, and check your benefits directly with your insurer."),
  subheading: "Coming soon", buttonLabel: "Call about your visit", buttonLink: PRACTICE.phone.href,
};
export const LOCATION: LocationContent = {
  ...block("contact", "FIND US", "Your next visit", "starts here.",
    "Plan your journey before the day of your visit. Please confirm your appointment location with the practice before you travel; the contact details below are reference details pending final verification."),
  mapLabel: "Confirm your appointment location before travelling. Open directions for a street map.",
  address: PRACTICE.locations[0].address,
  phone: PRACTICE.phone,
  hours: PRACTICE.locations[0].hours, detailsLabel: "LOCATION DETAILS — PLEASE CONFIRM BEFORE TRAVEL",
  badges: ["Free parking", "ADA accessible"],
  directions: { label: "Get directions", href: "https://www.google.com/maps/search/?api=1&query=2309%20NW%20Federal%20Highway%20Stuart%20FL%2034994" },
};
export const FAQ: FaqContent = {
  ...block("faq", "A LITTLE MORE CLARITY", "Questions before", "your visit?"),
  questions: [
    { id: "faq-1", question: "How can I request an appointment?", answer: "Explore the published physician profiles, then call the practice to discuss a visit. The online appointment page is currently a demonstration: it does not create an appointment or reserve a time." },
    { id: "faq-2", question: "Which insurance plans do you accept?", answer: "An accepted insurance list is not yet available. Please contact the practice and your insurer to confirm coverage before your visit." },
    { id: "faq-3", question: "What should I bring to my first visit?", answer: "Ask the practice which paperwork or instructions apply to your visit. Bring your questions and a current list of medicines, including non-prescription products and supplements. Confirm any appointment-specific preparation directly with the practice." },
    { id: "faq-4", question: "Is parking available?", answer: "Free parking and ADA accessibility are available at the practice. Contact the practice for the parking and entrance arrangements at your appointment location." },
    { id: "faq-5", question: "How do I cancel or reschedule?", answer: "Contact the practice as soon as your plans change and ask about the current cancellation or rescheduling requirements. A final cancellation policy is not yet published here." },
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
