// Shared seeds: retain current approved structure and expose its named content slots.
import { HERO, PRINCIPLES, SERVICES, BOOKING, PHYSICIANS, TESTIMONIALS, LOCATION, FAQ, CLOSING, HOME_METADATA } from "@/config/home-content";
import { ABOUT_PAGE, SERVICES_PAGE, PHYSICIANS_PAGE, RESOURCES_PAGE, INSURANCE_PAGE, INSURANCE_SETTINGS, CATALOG_COPY } from "@/config/pages/information";
import { SERVICE_ENTRIES, PHYSICIAN_ENTRIES, ARTICLE_ENTRIES } from "@/config/pages/catalogs";
import { CONTACT_PAGE, CONTACT_COPY, FAQ_PAGE, FAQ_GROUPS } from "@/config/pages/contact";
import { LEGAL_PAGE, LEGAL_ENTRIES, LEGAL_COPY } from "@/config/pages/legal";
import { SITE_NAVIGATION, SITE_FOOTER } from "@/config/site-shell";
import { PRACTICE } from "@/config/practice";
import { BOOKING_CTA } from "@/config/pages/helpers";
import { BOOKING_COPY } from "@/config/booking-copy";
import { BOOKING_SETTINGS } from "@/config/booking";
export const BOOKING_SEED = { copy: BOOKING_COPY, appointmentTypes: BOOKING_SETTINGS.types, providers: BOOKING_SETTINGS.providers };
export const HOME_SEED = { hero: HERO, principles: PRINCIPLES, services: SERVICES, booking: BOOKING, physicians: PHYSICIANS, testimonials: TESTIMONIALS, location: LOCATION, faq: FAQ, closing: CLOSING, metadata: HOME_METADATA };
export const SITE_SEED = { navigation: SITE_NAVIGATION, footer: SITE_FOOTER, practice: PRACTICE, catalog: CATALOG_COPY, closing: BOOKING_CTA, legal: LEGAL_COPY };
export const PAGE_SEEDS = {
  "/about": { content: ABOUT_PAGE }, "/services": { content: SERVICES_PAGE },
  "/physicians": { content: PHYSICIANS_PAGE }, "/resources": { content: RESOURCES_PAGE },
  "/insurance": { content: INSURANCE_PAGE, insurance: INSURANCE_SETTINGS },
  "/contact": { content: CONTACT_PAGE, copy: CONTACT_COPY },
  "/faq": { content: FAQ_PAGE, groups: FAQ_GROUPS },
  "/legal": { content: LEGAL_PAGE, copy: LEGAL_COPY },
};
export { SERVICE_ENTRIES, PHYSICIAN_ENTRIES, ARTICLE_ENTRIES, LEGAL_ENTRIES, LEGAL_COPY };
