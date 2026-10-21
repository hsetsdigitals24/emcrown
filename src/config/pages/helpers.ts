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
    notice: "Preview • Draft copy and practice details awaiting client approval.", sections: [],
  };
}
export const BOOKING_CTA = {
  ...mockSection("page-next-step", "Your next step.", "Get in touch with Emcrown Physician Services.", "A conversation."),
  eyebrow: "HERE FOR YOUR NEXT CHAPTER", buttonLabel: "Book appointment", buttonLink: "/book",
};
