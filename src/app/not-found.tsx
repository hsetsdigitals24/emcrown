// Server fallback: branded 404 with local page search and recovery links.
import RecoveryPanel from "@/components/recovery/RecoveryPanel";
import PageSearch from "@/components/recovery/PageSearch";
import { RECOVERY_COPY, PUBLIC_PAGES } from "@/config/pages/recovery";
import SiteLayout from "@/components/layout/SiteLayout";
import { SITE_NAVIGATION, SITE_FOOTER } from "@/config/site-shell";
export default function NotFound() {
  return <SiteLayout navigation={SITE_NAVIGATION} footer={SITE_FOOTER}><RecoveryPanel content={RECOVERY_COPY.notFound} homeLabel={RECOVERY_COPY.home} bookingLabel={RECOVERY_COPY.booking}>
    <PageSearch pages={PUBLIC_PAGES} copy={RECOVERY_COPY} />
  </RecoveryPanel></SiteLayout>;
}
