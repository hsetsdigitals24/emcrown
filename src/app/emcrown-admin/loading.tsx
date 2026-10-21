// Server fallback: branded loading screen without confidential content.
import PageLoader from "@/components/ui/PageLoader";
import { AUTH_COPY } from "@/config/auth";
export default function Loading() { return <PageLoader label={AUTH_COPY.loading} />; }
