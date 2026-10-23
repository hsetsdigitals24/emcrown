// Server route: published CMS content with shared rendering and metadata.
import { publicPhysicians } from "@/features/physicians/repository";
import { PublicPhysicianList } from "@/features/physicians/PublicPhysicians";
import "@/features/clinical/styles.css";
import { publishedContent } from "@/features/cms/public";
import { PAGE_SEEDS, SITE_SEED } from "@/config/cms/content";
import "@/app/physicians.css";
import PublishedPage from "@/features/cms/PublishedPage";
import { cmsMetadata } from "@/features/cms/metadata";
export async function generateMetadata() { return cmsMetadata("/physicians"); }
export default async function Page() {
  const records = await publicPhysicians();
  if (!records.length) return <PublishedPage path="/physicians" />;
  const [page, site] = await Promise.all([
    publishedContent("/physicians", PAGE_SEEDS["/physicians"]),
    publishedContent("/_site", SITE_SEED),
  ]);
  return <PublicPhysicianList records={records} content={page.content} site={site} />;
}
