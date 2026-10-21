// Server metadata adapter: title and description follow published content; indexing remains gated.
import "server-only";
import type { Metadata } from "next";
import { HOME_METADATA } from "@/config/home-content";
import { SITE_SETTINGS } from "@/config/practice";
import { findDefinition } from "@/config/cms/registry";
import { publishedContent } from "@/features/cms/public";
export async function cmsMetadata(path: string): Promise<Metadata> {
  const definition = findDefinition(path);
  if (!definition) return {};
  const values = await publishedContent(path, definition.initial);
  const title = path === "/" ? values["metadata.title"] ?? HOME_METADATA.title : `${values[path === "/book" ? "copy.title" : "content.title"]} | Emcrown Physician Services`;
  const description = path === "/" ? values["metadata.description"] ?? HOME_METADATA.description : values[path === "/book" ? "copy.introduction" : "content.description"];
  const url = `${SITE_SETTINGS.url}${path}`;
  return { title, description, alternates: { canonical: url }, openGraph: { title, description, url, type: "website" }, robots: { index: false, follow: false } };
}
