// Server helper: individual metadata, with preview indexing controlled by configuration.
import type { Metadata } from "next";
import type { PageContent } from "@/types/public";
import { SITE_SETTINGS } from "@/config/practice";
export function canIndexPublicContent(content: PageContent): boolean {
  return SITE_SETTINGS.indexingEnabled && content.hero.status === "published" && !content.hero.isMock;
}
export function publicMetadata(content: PageContent): Metadata {
  const title = `${content.title} | Emcrown Physician Services`;
  const url = `${SITE_SETTINGS.url}${content.path}`;
  const index = canIndexPublicContent(content);
  return { title, description: content.description, alternates: { canonical: url },
    openGraph: { title, description: content.description, url, type: "website" },
    robots: { index, follow: index },
  };
}
