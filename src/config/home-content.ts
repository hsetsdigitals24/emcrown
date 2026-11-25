// Shared CMS templates: homepage copy follows the supplied Physician Services document.
import { PRACTICE } from "@/config/practice";
import type { AboutContent, HomeBlock, BookingStepsContent, HeroContent, PhysicianContent, TestimonialsContent, LocationContent, FaqContent } from "@/types/home";
function block(id: string, eyebrow: string, headline: string, highlightedPhrase: string, body = ""): HomeBlock {
  return { id, status: "draft", isMock: true, eyebrow, headline, highlightedPhrase,
    subheading: "", body, buttonLabel: "", buttonLink: "", items: [] };
}
export const HERO: HeroContent = {
  ...block("home", "", "Need to see", "a doctor?",
    "We offer access to experienced physicians who listen to provide you with the personalized attention you deserve at every visit."),
  subheading: "Walk-Ins & Same Day available at EmCrown Physician Services",
  buttonLabel: "Book an appointment", buttonLink: "/book",
  photoLabel: "People talking during a consultation",
  media: { poster: "/media/hero-consultation.jpg", photo: "/media/hero-care.jpg", video: "/media/hero-consultation.mp4",
    label: "A consultation with a physician", pauseLabel: "Pause hero video", playLabel: "Play hero video" },
  chip: "Start with a conversation", imageCaption: "A space for your next chapter.",
  notice: "",
  items: [
    { id: "trust-1", title: "Free parking", description: "" },
    { id: "trust-2", title: "ADA accessible", description: "" },
    { id: "trust-3", title: "Get to know your physician", description: "" },
  ],
};
export const PRINCIPLES: HomeBlock = {
  ...block("mission", "Our approach", "Compassionate and personalized care", ""),
  items: [
    { id: "principle-1", title: "Physicians that listen and care", description: "Experienced physicians who listen and provide the personalized attention you deserve at every visit.", link: { label: "About us", href: "/about" } },
    { id: "principle-2", title: "Comprehensive care for adults", description: "From preventive check-ups to managing ongoing health concerns, our team is here to keep you healthy at every stage of life.", link: { label: "Our services", href: "/services" } },
    { id: "principle-3", title: "Walk-Ins & Same Day", description: "Need to see a doctor? Walk-Ins & Same Day available at EmCrown Physician Services.", link: { label: "Book an appointment", href: "/book" } },
  ],
};
export const ABOUT: AboutContent = {
  ...block("about", "About us", "EmCrown Physician", "Services",
    "We are a community-based, patient-centered primary care clinic focused on ensuring every patient receives prioritized quality, safe, compassionate and expert care from medical personnel that appreciate their needs."),
  image: { src: "/media/hero-care.jpg", alt: "A physician listening to a patient during a consultation" },
  subheading: "Our Values", buttonLabel: "Learn more about us", buttonLink: "/about",
  items: [
    { id: "value-1", title: "Respect for every patient", description: "" },
    { id: "value-2", title: "High standard of care", description: "" },
    { id: "value-3", title: "Effective service delivery", description: "" },
  ],
};
export const SERVICES: HomeBlock = {
  ...block("services", "Our services", "Comprehensive Healthcare in", "Stuart, Florida",
    "At EmCrown Physician Services, we provide personalized, cost-effective, patient-centered medical care that you deserve."),
  buttonLabel: "Explore all services", buttonLink: "/services",
  items: [
    { id: "service-1", title: "Primary Care & Family Medicine", description: "Your first point of care for everyday health needs. General health, urgent care visits and management of chronic conditions.", link: { label: "Learn more", href: "/services" } },
    { id: "service-2", title: "Preventive Care", description: "Staying healthy is easier than getting healthy. Immunizations, preventive health screenings, lifestyle and nutrition counseling, and physicals.", link: { label: "Learn more", href: "/services" } },
    { id: "service-3", title: "Chronic Disease Management", description: "Ongoing support to help you live better, longer. Diabetes, hypertension, asthma and COPD care, and weight management programs.", link: { label: "Learn more", href: "/services" } },
  ],
};
export const BOOKING: BookingStepsContent = {
  ...block("booking", "YOUR NEXT STEP", "A simpler path to", "your appointment.",
    "Choose your physician, discuss a time that works for you and prepare for your visit. Contact the practice for help with your appointment."),
  buttonLabel: "Meet our physicians", buttonLink: "/physicians",
  background: { images: ["/media/hero-consultation.jpg", "/media/hero-care.jpg"], label: "Stock imagery • Not Emcrown staff or patients" },
  items: [
    { id: "step-1", title: "Choose a visit", description: "Read the physician profiles and ask whether the practice can help with the concern you want to discuss." },
    { id: "step-2", title: "Pick a time", description: "Confirm the physician, location, availability and any coverage requirements before arranging your appointment." },
    { id: "step-3", title: "Get confirmation", description: "Confirm your appointment details with the practice and ask what to bring before you arrive." },
  ],
};
export const PHYSICIANS: PhysicianContent = {
  ...block("physicians", "Our team", "Meet our", "physicians",
    "EmCrown Physician Services is led by Board certified medical personnel with extensive clinical practice experience, providing high quality, cost-efficient, comprehensive medical and acute care services."),
  buttonLabel: "Meet our team", buttonLink: "/physicians",
  labels: { profile: "View profile", book: "Book an appointment", unavailable: "Please contact us to learn more about our physicians.", contact: { label: "Contact us", href: "/contact" } },
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
  ...block("insurance", "Insurance", "Let’s make care", "more accessible",
    "We work with a wide range of insurance providers to make care more accessible. Please contact us ahead of your appointment to verify your plan."),
  subheading: "Please bring to each appointment", buttonLabel: "Verify your insurance", buttonLink: "/insurance",
  items: [
    { id: "insurance-card", title: "Your insurance card", description: "" },
    { id: "insurance-id", title: "A valid photo ID", description: "" },
  ],
};
export const LOCATION: LocationContent = {
  ...block("contact", "Contact us", "We’re here for", "your next visit",
    "Get in touch with EmCrown Physician Services for appointments, insurance verification and questions about your visit."),
  buttonLabel: "Contact us", buttonLink: "/contact",
  mapLabel: "Confirm your appointment location before travelling. Open directions for a street map.",
  address: PRACTICE.locations[0].address,
  phone: PRACTICE.phone,
  hours: PRACTICE.locations[0].hours, detailsLabel: "YOUR VISIT",
  badges: ["Free parking", "ADA accessible"],
  directions: { label: "Get directions", href: "https://www.google.com/maps/search/?api=1&query=2309%20NW%20Federal%20Highway%20Stuart%20FL%2034994" },
};
export const FAQ: FaqContent = {
  ...block("faq", "A LITTLE MORE CLARITY", "Questions before", "your visit?"),
  questions: [
    { id: "faq-1", question: "How can I request an appointment?", answer: "Explore our physician profiles and open the appointment page to see your booking options. You can also call the practice to arrange a visit." },
    { id: "faq-2", question: "Which insurance plans do you accept?", answer: "An accepted insurance list is not yet available. Please contact the practice and your insurer to confirm coverage before your visit." },
    { id: "faq-3", question: "What should I bring to my first visit?", answer: "Ask the practice which paperwork or instructions apply to your visit. Bring your questions and a current list of medicines, including non-prescription products and supplements. Confirm any appointment-specific preparation directly with the practice." },
    { id: "faq-4", question: "Is parking available?", answer: "Free parking and ADA accessibility are available at the practice. Contact the practice for the parking and entrance arrangements at your appointment location." },
    { id: "faq-5", question: "How do I cancel or reschedule?", answer: "Contact the practice as soon as your plans change and ask about the current cancellation or rescheduling requirements. A final cancellation policy is not yet published here." },
  ],
};
export const CLOSING: HomeBlock = {
  ...block("next-step", "EmCrown Physician Services", "Need to see", "a doctor?",
    "Walk-Ins & Same Day available at EmCrown Physician Services."),
  image: { src: "/media/hero-consultation.jpg", alt: "A conversation with a physician" },
  buttonLabel: "Book an appointment", buttonLink: "/book",
};
export const HOME_METADATA = {
  title: "EmCrown Physician Services | Primary Care in Stuart, Florida",
  description: "Compassionate, personalized primary care in Stuart, Florida. Explore our services, meet our physicians and book an appointment with EmCrown Physician Services.",
  canonical: "https://emcrownphysicians.com",
};
