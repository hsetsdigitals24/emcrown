// Shared renderer: public server pages and preview use the same seeds and components.
import type { PublicPhysician } from "@/types/clinical";
import { HOME_SEED, SITE_SEED, BOOKING_SEED } from "@/config/cms/content";
import BookingContent from "@/features/cms/BookingContent";
import type { MockSchedule } from "@/types/booking";
import { applyContent } from "@/features/cms/fields";
import HomeContent from "@/features/cms/HomeContent";
import { InformationContent, type CmsContext } from "@/features/cms/InformationContent";
import type { CmsValues } from "@/types/cms";
export default function PageContent({ path, values, siteValues, context = {}, preview = false, schedule, physicianRecords }: {
  path: string; values: CmsValues; siteValues: CmsValues; context?: CmsContext; preview?: boolean; schedule?: MockSchedule; physicianRecords?: PublicPhysician[];
}) {
  if (path === "/book" && schedule) return <BookingContent content={applyContent(BOOKING_SEED, values)} site={applyContent(SITE_SEED, siteValues)} schedule={schedule} />;
  if (path === "/" || path === "/_site") return <HomeContent content={applyContent(HOME_SEED, path === "/" ? values : context["/"] ?? {})} preview={preview} records={physicianRecords} />;
  return <InformationContent path={path} values={values} site={applyContent(SITE_SEED, siteValues)} context={context} />;
}
