// Shared contracts for editable frontend content; no CMS integration.
export type ContentStatus = "draft" | "published";
export type ContentLink = { label: string; href: string };
export type SectionContent = {
  id: string;
  status: ContentStatus;
  isMock: boolean;
  eyebrow: string;
  headline: string;
  highlightedPhrase: string;
  subheading: string;
  body: string;
  buttonLabel: string;
  buttonLink: string;
};
export type NavigationItem = ContentLink & {
  previews?: Array<ContentLink & { description: string; photo?: string }>;
};
export type NavigationContent = {
  brand: ContentLink;
  label: string;
  menuLabel: string;
  skipLabel: string;
  items: NavigationItem[];
  booking: ContentLink;
  call?: ContentLink;
};
export type FooterContent = {
  panels?: { eyebrow: string; headline: string; contactTitle: string; linksTitle: string; hoursTitle: string; cta: ContentLink };
  practiceName: string;
  description: string;
  navigationLabel: string;
  links: ContentLink[];
  legalLinks: ContentLink[];
  address: string;
  locations?: { label: string; address: string }[];
  phone?: ContentLink;
  faxLabel: string;
  fax: string;
  hoursLabel: string;
  hours: string[];
  copyright: string;
};
