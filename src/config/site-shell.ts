// Shared public shell content; links target real informational routes and mock detail pages.
import type { FooterContent, NavigationContent } from "@/types/content";
import { SERVICE_ENTRIES, PHYSICIAN_ENTRIES } from "@/config/pages/catalogs";
import { PRACTICE } from "@/config/practice";
export const NAVIGATION_COPY = { viewAll: "View all" };
export const SITE_NAVIGATION: NavigationContent = {
  brand: { label: "Emcrown", href: "/" }, label: "Main navigation", menuLabel: "Menu", skipLabel: "Skip to content",
  items: [
    { label: "Services", href: "/services", previews: SERVICE_ENTRIES.slice(0, 3).map((entry) => ({ label: entry.title, href: entry.path, description: entry.hero.body })) },
    { label: "Physicians", href: "/physicians", previews: PHYSICIAN_ENTRIES.map((entry) => ({ label: entry.name, href: entry.path, description: entry.specialty })) },
    { label: "About", href: "/about" }, { label: "Insurance", href: "/insurance" },
    { label: "Resources", href: "/resources" }, { label: "Contact", href: "/contact" },
  ], booking: { label: "Book appointment", href: "/book" }, call: { label: "Call", href: PRACTICE.phone.href },
};
export const SITE_FOOTER: FooterContent = {
  panels: { eyebrow: "EMCROWN PHYSICIAN SERVICES", headline: "Your next chapter starts here.", contactTitle: "Get in touch", linksTitle: "Explore", hoursTitle: "Practice hours", cta: { label: "Find your physician", href: "/physicians" } },
  practiceName: "Emcrown Physician Services", description: "Get to know your physician, prepare for your visit and take the next step with Emcrown Physician Services.",
  navigationLabel: "Footer navigation", links: [...SITE_NAVIGATION.items, { label: "FAQ", href: "/faq" }, { label: "Legal", href: "/legal" }],
  legalLinks: [{ label: "Privacy", href: "/privacy" }, { label: "Terms", href: "/terms" }, { label: "Accessibility", href: "/accessibility" }, { label: "Notice of Privacy Practices", href: "/notice-of-privacy-practices" }],
  locations: PRACTICE.locations.map(({ label, address }) => ({ label, address })),
  address: `Reference address: ${PRACTICE.locations[0].address}`, phone: PRACTICE.phone,
  faxLabel: "Fax", fax: PRACTICE.fax, hoursLabel: "Practice hours", hours: [PRACTICE.locations[0].hours],
  copyright: "© Emcrown Physician Services.",
};
