// Shared public shell content; links target real informational routes and mock detail pages.
import type { FooterContent, NavigationContent } from "@/types/content";
import { PRACTICE } from "@/config/practice";
export const NAVIGATION_COPY = { viewAll: "View all" };
export const SITE_NAVIGATION: NavigationContent = {
  brand: { label: "EmCrown Physician Services", href: "/" },
  tagline: "Compassionate and personalized care", home: { label: "Home", href: "/" }, viewAllLabel: "View all",
  label: "Main navigation", menuLabel: "Menu", skipLabel: "Skip to content",
  items: [
    { label: "About Us", href: "/about" }, { label: "Our Services", href: "/services" },
    { label: "Appointment", href: "/book" }, { label: "Contact Us", href: "/contact" },
  ], booking: { label: "Book appointment", href: "/book" },
};
export const SITE_FOOTER: FooterContent = {
  panels: { eyebrow: "EMCROWN PHYSICIAN SERVICES", headline: "Your next chapter starts here.", contactTitle: "Get in touch", linksTitle: "Explore", hoursTitle: "Practice hours", cta: { label: "Find your physician", href: "/physicians" } },
  practiceName: "EmCrown Physician Services", description: "A community-based, patient-centered primary care clinic providing quality, safe, compassionate and expert care.",
  legalNavigationLabel: "Legal navigation",
  navigationLabel: "Footer navigation", links: [SITE_NAVIGATION.home!, ...SITE_NAVIGATION.items],
  legalLinks: [{ label: "Privacy", href: "/privacy" }, { label: "Terms", href: "/terms" }, { label: "Accessibility", href: "/accessibility" }, { label: "Notice of Privacy Practices", href: "/notice-of-privacy-practices" }],
  locations: PRACTICE.locations.map(({ label, address }) => ({ label, address })),
  address: `Reference address: ${PRACTICE.locations[0].address}`,
  faxLabel: "Fax", fax: PRACTICE.fax, hoursLabel: "Practice hours", hours: [PRACTICE.locations[0].hours],
  copyright: "© Emcrown Physician Services.",
};
