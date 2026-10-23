// Shared internal fixture helpers: all generated sections remain editable draft content.
import type { SectionContent } from "@/types/content";
import type { PageContent } from "@/types/public";
export function mockSection(id: string, headline: string, body: string, highlightedPhrase = ""): SectionContent {
  return { id, status: "draft", isMock: true, eyebrow: "", headline,
    highlightedPhrase, subheading: "", body, buttonLabel: "", buttonLink: "" };
}
export function mockPage(path: string, title: string, headline: string, highlightedPhrase: string, body: string): PageContent {
  return { path, title, description: body,
    hero: { ...mockSection(`${path.replaceAll("/", "-").slice(1)}-hero`, headline, body, highlightedPhrase), eyebrow: title },
    notice: "", sections: [],
  };
}
export const BOOKING_CTA = {
  ...mockSection("page-next-step", "Let’s talk about", "Explore our physicians or contact the practice with your questions before arranging a visit.", "your next step."),
  eyebrow: "HERE FOR YOUR NEXT CHAPTER", buttonLabel: "Book appointment", buttonLink: "/book",
};
