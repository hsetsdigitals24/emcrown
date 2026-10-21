// Shared, clearly marked mock content; replace with validated CMS content later.
import type { FooterContent, NavigationContent, SectionContent } from "@/types/content";
export const MOCK_SECTION: SectionContent = {
  id: "mock-section", status: "draft", isMock: true,
  eyebrow: "[EYEBROW]", headline: "[HEADLINE]",
  highlightedPhrase: "[HIGHLIGHTED PHRASE]", subheading: "[SUBHEADING]",
  body: "[BODY COPY: awaiting client approval]",
  buttonLabel: "[SECONDARY ACTION]", buttonLink: "#mock-section",
};
export const MOCK_NAVIGATION: NavigationContent = {
  brand: { label: "[LOGO PLACEHOLDER: Emcrown Physician Services]", href: "/" },
  label: "Main navigation", menuLabel: "Menu", skipLabel: "Skip to content",
  items: ["Services", "Physicians", "About", "Insurance", "Resources", "Contact"].map(
    (label) => ({ label, href: `/${label.toLowerCase()}`,
      previews: ["Services", "Physicians"].includes(label)
        ? [{ label: `[${label.toUpperCase()} PREVIEW]`, href: `/${label.toLowerCase()}`,
            description: "[DESCRIPTION: awaiting client content]" }] : undefined,
    }),
  ),
  booking: { label: "Book appointment", href: "/book" },
  // No fabricated telephone link: add call after contact details are verified.
};
export const MOCK_FOOTER: FooterContent = {
  practiceName: "Emcrown Physician Services", description: "[PRACTICE DESCRIPTION]",
  navigationLabel: "Footer navigation", links: MOCK_NAVIGATION.items,
  legalLinks: [{ label: "Privacy", href: "/privacy" }, { label: "Terms", href: "/terms" }],
  address: "[VERIFIED PRACTICE ADDRESS]", faxLabel: "Fax", fax: "[FAX NUMBER]",
  hoursLabel: "Hours", hours: ["[VERIFIED PRACTICE HOURS]"],
  copyright: "[APPROVED COPYRIGHT TEXT]",
};
