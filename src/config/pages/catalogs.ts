// Shared catalogs: mock slugs and factual placeholders, never invented practice details.
import type { ServiceEntry, PhysicianEntry, ArticleEntry } from "@/types/public";
import { mockPage, mockSection } from "@/config/pages/helpers";
export const SERVICE_ENTRIES: ServiceEntry[] = Array.from({ length: 6 }, (_, index) => {
  const slug = `service-${index + 1}`;
  return { ...mockPage(`/services/${slug}`, `[SERVICE NAME ${index + 1}]`, "[SERVICE NAME]", "[CARE FOCUS]",
    "[SERVICE OVERVIEW: approved conditions, treatments and care approach to follow]"),
    slug, category: "[SERVICE CATEGORY]", tags: ["[SERVICE CATEGORY]"], photoLabel: "[PHOTO PLACEHOLDER: service consultation]",
    sections: [mockSection("service-overview", "About this service", "[SERVICE DETAILS: approved scope of care]"),
      mockSection("service-conditions", "What we treat", "[CONDITIONS AND ELIGIBILITY: awaiting confirmed services list]"),
      mockSection("service-visit", "What to expect", "[VISIT GUIDANCE: approved preparation and care pathway]")],
  };
});
export const PHYSICIAN_ENTRIES: PhysicianEntry[] = Array.from({ length: 3 }, (_, index) => {
  const slug = `physician-${index + 1}`;
  return { ...mockPage(`/physicians/${slug}`, "Dr. [PHYSICIAN NAME]", "Dr. [PHYSICIAN NAME]", "[SPECIALTY]",
    "[PHYSICIAN INTRODUCTION: awaiting client CV and approved biography]"),
    slug, name: "Dr. [PHYSICIAN NAME]", specialty: "[SPECIALTY]", category: "[SPECIALTY]",
    credentials: "[APPROVED CREDENTIALS]", languages: ["[LANGUAGES SPOKEN]"],
    labels: { credentials: "Credentials", languages: "Languages", specialty: "Specialty" },
    photoLabel: `[PHOTO PLACEHOLDER: physician ${index + 1} portrait]`,
    sections: [mockSection("physician-statement", "In their own words", "[PERSONAL STATEMENT: approved physician copy]"),
      mockSection("physician-background", "Experience and education", "[BIOGRAPHY: approved CV details, education and experience]")],
  };
});
export const ARTICLE_ENTRIES: ArticleEntry[] = Array.from({ length: 3 }, (_, index) => {
  const slug = `article-${index + 1}`;
  return { ...mockPage(`/resources/${slug}`, `[ARTICLE TITLE ${index + 1}]`, "[ARTICLE TITLE]", "[HIGHLIGHTED PHRASE]",
    "[ARTICLE SUMMARY: educational content awaiting approval and medical review]"),
    slug, category: `[RESOURCE CATEGORY ${index + 1}]`, author: "[AUTHOR NAME AND CREDENTIALS]",
    reviewDate: "[MEDICAL REVIEW DATE]", publishedDate: "[PUBLISH DATE]",
    labels: { author: "Written by", reviewDate: "Medically reviewed", publishedDate: "Published", category: "Category" },
    photoLabel: "[PHOTO PLACEHOLDER: approved article illustration]",
    sections: [mockSection("article-introduction", "[ARTICLE SECTION HEADING]", "[ARTICLE INTRODUCTION: approved plain-text content]"),
      mockSection("article-body", "[ARTICLE SECTION HEADING]", "[ARTICLE BODY: approved plain-text content]"),
      mockSection("article-references", "Sources and review", "[APPROVED SOURCES AND MEDICAL REVIEW DETAILS]")],
  };
});
