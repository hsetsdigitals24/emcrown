// Server route: compose the validated authentication screen.
import PageLoader from "@/components/ui/PageLoader";
import { Suspense } from "react";
import AuthScreen from "@/features/auth/AuthScreen";
import { AUTH_COPY } from "@/config/auth";
export default function Page() { return <Suspense fallback={<PageLoader label={AUTH_COPY.loading} />}><AuthScreen mode="reset" /></Suspense>; }
