// Shared editable page fixtures for practice, indexes and coverage.
import { mockPage, mockSection } from "@/config/pages/helpers";
import type { InsuranceConfig } from "@/types/public";
export const ABOUT_PAGE = {
  ...mockPage("/about", "About the practice", "A practice built around", "people.", "[PRACTICE INTRODUCTION: approved story and mission to follow]"),
  photoLabel: "[PHOTO PLACEHOLDER: Emcrown practice team]",
  sections: [mockSection("about-story", "Our story", "[PRACTICE HISTORY: approved founding story and milestones]"),
    mockSection("about-mission", "Our mission", "[MISSION AND VALUES: approved practice commitments]"),
    mockSection("about-certifications", "Certifications", "[CONFIRMED CERTIFICATIONS: approved supporting details]"),
    mockSection("about-awards", "Awards", "[CONFIRMED AWARDS: omit this section if none are supplied]"),
    mockSection("about-affiliations", "Affiliations", "[CONFIRMED AFFILIATIONS: approved organisations and relationships]")],
};
export const SERVICES_PAGE = mockPage("/services", "Services", "Explore the care", "we offer.", "[SERVICE INTRODUCTION: the client’s services list is still to be confirmed]");
export const PHYSICIANS_PAGE = mockPage("/physicians", "Our physicians", "Get to know the people", "behind your care.", "[PHYSICIAN INTRODUCTION: approved CVs, photos and specialties to follow]");
export const RESOURCES_PAGE = mockPage("/resources", "Resources and blog", "A little more", "understanding.", "[RESOURCE INTRODUCTION: educational articles and patient resources awaiting review]");
export const INSURANCE_PAGE = {
  ...mockPage("/insurance", "Insurance", "Clarity about", "your coverage.", "Contact the practice and your insurer to verify your benefits before a visit."),
  sections: [mockSection("insurance-verification", "Before your visit", "[COVERAGE VERIFICATION GUIDANCE: approved practice instructions]"),
    mockSection("insurance-costs", "Questions about your visit", "[PAYMENT AND COVERAGE GUIDANCE: approved practice instructions]")],
};
export const INSURANCE_SETTINGS: InsuranceConfig = { state: "comingSoon", plans: [], comingSoonLabel: "Accepted insurance information is coming soon.", availableLabel: "Accepted insurance plans" };
export const CATALOG_COPY = { serviceLink: "Learn more", physicianLink: "View biography", articleLink: "Read article", categories: "Browse by category", all: "All resources", biographyBooking: "Book with Dr. [NAME]", biographyBookingLink: "/book", back: "Back to index" };
