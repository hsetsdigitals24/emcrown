// Shared pure search: matches only public page labels and never sends a query externally.
import type { ContentLink } from "@/types/content";
export function searchPublicPages(pages: ContentLink[], query: string): ContentLink[] {
  const words = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  return pages.filter((page) => words.every((word) => page.label.toLocaleLowerCase().includes(word)));
}
