// Shared editorial drafts: patient-facing copy without unverified practice claims.
import { mockPage, mockSection } from "@/config/pages/helpers";
import type { InsuranceConfig } from "@/types/public";
export const ABOUT_PAGE = {
  ...mockPage("/about", "About Emcrown Physician Services", "Your health is personal.", "Your care should be, too.", "A question about your health deserves a conversation. At Emcrown Physician Services, our focus starts with the person behind that question: what matters to you, what you want to understand and what comes next."),
  sections: [
    mockSection("about-story", "Start with what matters to you", "You bring more than a reason for an appointment. You bring your daily routine, your concerns and your own experience of your health. Our aim is to make room for that perspective, so conversations about care begin with you."),
    mockSection("about-mission", "Understanding is part of care", "Medical decisions can raise new questions. We believe people should feel able to ask what an option means, why it is being discussed and what the next step involves. Clear language and an open conversation are at the heart of the experience we want to offer."),
    mockSection("about-certifications", "Get to know your physician", "Choosing a physician is a personal decision. Explore our published profiles to learn about each physician’s background and areas of care. If you are unsure who to see, contact the practice before requesting an appointment."),
    mockSection("about-awards", "A little preparation makes a difference", "Write down the questions you want to discuss and keep any appointment instructions together. Our visit guides explain how to prepare, what to ask about coverage and which practical details to confirm before you travel."),
    mockSection("about-affiliations", "Take the next step at your pace", "Browse our physicians, read the visit information or call with a practical question. You do not need to know every answer before you get in touch. Start with the question you have today."),
  ],
};
export const SERVICES_PAGE = mockPage("/services", "Services and visit guidance", "Find your", "next step in care.", "Not sure where to start? These guides help you discuss your needs, prepare for an appointment and plan what comes afterward. Contact the practice to confirm which clinical services and visit types are available for you.");
export const PHYSICIANS_PAGE = { ...mockPage("/physicians", "Our physicians", "Get to know the people", "behind your care.", "Choosing a physician starts with getting to know them. Explore each profile to learn about their background, areas of care and the languages they speak. When you’re ready, start an appointment request from their profile."), notice: "" };
export const RESOURCES_PAGE = mockPage("/resources", "Patient resources", "Feel more prepared.", "Ask with confidence.", "Practical reading for the moments before and after an appointment. Start with simple ways to organise your questions, discuss your visit and check your coverage. These guides support a conversation with your physician; they do not provide a diagnosis or individual treatment advice.");
export const INSURANCE_PAGE = {
  ...mockPage("/insurance", "Insurance and payment questions", "Fewer surprises.", "More clarity.", "Before you book, check how your insurance applies to the physician, location and visit you have in mind. An accepted-plan list is not yet available here, so please verify directly with the practice and your insurer."),
  sections: [
    mockSection("insurance-verification", "Ask about your specific plan", "Plan names can look similar while offering different networks and benefits. Ask the practice whether your exact plan is accepted for the physician and location you want to visit. Then ask your insurer about network status, referral requirements and any authorisation needed for that visit."),
    mockSection("insurance-costs", "Understand what you may need to pay", "Ask your insurer about your deductible, copayment and coinsurance. If you plan to pay yourself, ask the practice about charges and payment arrangements before the appointment. Keep a note of the answers you receive; this website does not confirm coverage or quote a visit price."),
  ],
};
export const INSURANCE_SETTINGS: InsuranceConfig = { state: "comingSoon", plans: [], comingSoonLabel: "Please contact the practice to check your plan. An accepted-plan list is not yet published.", availableLabel: "Accepted insurance plans" };
export const CATALOG_COPY = { serviceLink: "Explore this guide", physicianLink: "View biography", articleLink: "Read the guide", categories: "Browse by topic", all: "All resources", biographyBooking: "Request an appointment", biographyBookingLink: "/book", back: "Back to index" };
