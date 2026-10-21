// Server metadata route: only approved published content is eligible for discovery.
import type { MetadataRoute } from "next";
import { SITE_SETTINGS } from "@/config/practice";
import { SERVICE_ENTRIES, PHYSICIAN_ENTRIES, ARTICLE_ENTRIES } from "@/config/pages/catalogs";
import { INFORMATION_PAGES } from "@/config/pages/registry";
import { HERO } from "@/config/home-content";
export default function sitemap(): MetadataRoute.Sitemap {
  if (!SITE_SETTINGS.indexingEnabled) return [];
  const approved = [...INFORMATION_PAGES, ...SERVICE_ENTRIES, ...PHYSICIAN_ENTRIES, ...ARTICLE_ENTRIES].filter((entry) => entry.hero.status === "published" && !entry.hero.isMock);
  const paths = HERO.status === "published" && !HERO.isMock ? ["/", ...approved.map((entry) => entry.path)] : approved.map((entry) => entry.path);
  return paths.map((path) => ({ url: `${SITE_SETTINGS.url}${path}` }));
}
