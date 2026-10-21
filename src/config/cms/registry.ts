// Shared page registry: editor discovery, validation and rendering use the same field keys.
import { defineContent } from "@/features/cms/fields";
import { HOME_SEED, SITE_SEED, BOOKING_SEED, PAGE_SEEDS, SERVICE_ENTRIES, PHYSICIAN_ENTRIES, ARTICLE_ENTRIES, LEGAL_ENTRIES } from "@/config/cms/content";
export const CMS_DEFINITIONS = [
  defineContent("/", "Home", HOME_SEED),
  defineContent("/book", "Booking · demo content", BOOKING_SEED),
  ...Object.entries(PAGE_SEEDS).map(([path, seed]) => defineContent(path, seed.content.title, seed)),
  ...[...SERVICE_ENTRIES, ...PHYSICIAN_ENTRIES, ...ARTICLE_ENTRIES, ...LEGAL_ENTRIES].map(content => defineContent(content.path, content.title, { content })),
  defineContent("/_site", "Site settings · navigation, footer & contact", SITE_SEED),
];
export function findDefinition(path: string) { return CMS_DEFINITIONS.find(entry => entry.path === path); }
