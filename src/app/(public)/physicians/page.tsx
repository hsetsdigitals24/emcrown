// Server route: published CMS content with shared rendering and metadata.
import { publicPhysicians } from "@/features/physicians/repository";
import { PublicPhysicianList } from "@/features/physicians/PublicPhysicians";
import "@/features/clinical/styles.css";
import PublishedPage from "@/features/cms/PublishedPage";
import { cmsMetadata } from "@/features/cms/metadata";
export async function generateMetadata() { return cmsMetadata("/physicians"); }
export default async function Page() {
  const records = await publicPhysicians();
  return records.length ? <PublicPhysicianList records={records} /> : <PublishedPage path="/physicians" />;
}
