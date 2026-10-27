// Shared frontend contracts for the draft homepage blocks.
import type { ContentLink, SectionContent } from "@/types/content";
export type HomeItem = {
  id: string; title: string; description: string; label?: string;
  tags?: string[]; link?: ContentLink;
  image?: { src: string; label: string };
};
export type HomeBlock = SectionContent & { items: HomeItem[] };
export type HeroContent = HomeBlock & {
  photoLabel: string; chip: string; secondary: ContentLink;
  notice: string; imageCaption: string;
  media: { poster: string; photo: string; video: string; label: string; pauseLabel: string; playLabel: string };
};
export type BookingStepsContent = HomeBlock & { background: { images: string[]; label: string } };
export type PhysicianContent = HomeBlock & {
  physicians: Array<{ id: string; name: string; specialty: string; photoLabel: string; photo?: string; link: ContentLink }>;
};
export type TestimonialsContent = HomeBlock & {
  controls: { autoplayMs: number; pause: string; play: string; label: string; roleDescription: string; previous: string; next: string; goTo: string; slide: string; of: string };
  testimonials: Array<{ id: string; quote: string; attribution: string; label: string }>;
};
export type LocationContent = HomeBlock & {
  mapLabel: string; address: string; phone: ContentLink; hours: string;
  detailsLabel: string; badges: string[]; directions: ContentLink;
};
export type FaqContent = HomeBlock & { questions: Array<{ id: string; question: string; answer: string }> };
