// Shared frontend contracts for public informational pages and mock catalogs.
import type { ContentLink, SectionContent } from "@/types/content";
export type PageContent = {
  path: string; title: string; description: string; hero: SectionContent;
  notice: string; sections: SectionContent[]; photoLabel?: string;
};
export type PublicEntry = PageContent & { slug: string; category: string };
export type GuideExperience = {
  intro: string; checklist: string[]; prompts: string[];
  questions: Array<{ title: string; body: string }>;
};
export type ServiceEntry = PublicEntry & { tags: string[]; guide: GuideExperience; image: string };
export type PhysicianEntry = PublicEntry & {
  name: string; specialty: string; credentials: string; languages: string[];
  labels: { credentials: string; languages: string; specialty: string };
};
export type ArticleEntry = PublicEntry & {
  author: string; reviewDate: string; publishedDate: string;
  labels: { author: string; reviewDate: string; publishedDate: string; category: string };
};
export type PracticeLocation = {
  id: string; label: string; address: string; hours: string; parking: string;
  accessibility: string; directions: ContentLink; mapLabel: string;
};
export type PracticeConfig = {
  phone: ContentLink; fax: string; email: string | null;
  locationSelectorEnabled: boolean; locations: PracticeLocation[];
};
export type FaqGroup = {
  id: string; title: string; items: Array<{ id: string; question: string; answer: string }>;
};
export type InsuranceConfig = {
  state: "comingSoon" | "available";
  plans: Array<{ id: string; name: string; description: string }>;
  comingSoonLabel: string; availableLabel: string;
};
