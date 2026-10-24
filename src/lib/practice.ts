// Shared presentation: one active location, with directions derived from its editable address.
import type { FooterContent } from "@/types/content";
import type { PracticeConfig } from "@/types/public";
export function singlePractice(practice: PracticeConfig): PracticeConfig {
  return { ...practice, locationSelectorEnabled: false, locations: practice.locations.slice(0, 1).map(location => {
    const directions = new URL("https://www.google.com/maps/search/");
    directions.searchParams.set("api", "1"); directions.searchParams.set("query", location.address);
    return { ...location, directions: { ...location.directions, href: directions.toString() } };
  }) };
}

export function practiceFooter(footer: FooterContent, practice: PracticeConfig): FooterContent {
  const current = singlePractice(practice);
  return { ...footer, locations: current.locations.map(({ label, address }) => ({ label, address })),
    address: current.locations[0].address, hours: [current.locations[0].hours] };
}
