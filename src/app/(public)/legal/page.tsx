// Server route: published CMS content with shared rendering and metadata.
import PublishedPage from "@/features/cms/PublishedPage";
import { cmsMetadata } from "@/features/cms/metadata";
export async function generateMetadata() { return cmsMetadata("/legal"); }
export default function Page() { return <PublishedPage path="/legal" />; }
