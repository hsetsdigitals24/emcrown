// Server detail route: allowlisted CMS entries, published content and metadata.
import { notFound } from "next/navigation";
import PublishedPage from "@/features/cms/PublishedPage";
import { cmsMetadata } from "@/features/cms/metadata";
import { ARTICLE_ENTRIES } from "@/config/cms/content";
import { findDefinition } from "@/config/cms/registry";
type Props = { params: Promise<{ slug: string }> };
export function generateStaticParams() { return ARTICLE_ENTRIES.map(entry => ({ slug: entry.slug })); }
async function contentPath(params: Props["params"]) {
  const path = `/resources/${(await params).slug}`;
  if (!findDefinition(path)) notFound();
  return path;
}
export async function generateMetadata({ params }: Props) { return cmsMetadata(await contentPath(params)); }
export default async function DetailPage({ params }: Props) { return <PublishedPage path={await contentPath(params)} />; }
