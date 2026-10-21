// Client component: retry uses installed Next.js API; raw error details stay private.
"use client";
import PageSearch from "@/components/recovery/PageSearch";
import RecoveryPanel from "@/components/recovery/RecoveryPanel";
import { RECOVERY_COPY, PUBLIC_PAGES } from "@/config/pages/recovery";
export default function ErrorFallback({ retry }: { retry: () => void }) {
  return <RecoveryPanel content={RECOVERY_COPY.error} homeLabel={RECOVERY_COPY.home} bookingLabel={RECOVERY_COPY.booking}>
    <button className="recovery-link" type="button" onClick={retry}>{RECOVERY_COPY.retry}</button>
    <PageSearch pages={PUBLIC_PAGES} copy={RECOVERY_COPY} />
  </RecoveryPanel>;
}
