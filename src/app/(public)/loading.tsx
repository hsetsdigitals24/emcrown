// Server fallback: branded loading screen while public route content streams.
import PageLoader from "@/components/ui/PageLoader";
import { RECOVERY_COPY } from "@/config/pages/recovery";
export default function Loading() { return <PageLoader label={RECOVERY_COPY.loading} />; }
