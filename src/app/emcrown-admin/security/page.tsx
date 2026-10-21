// Server route: authenticated security overview.
import PageLoader from "@/components/ui/PageLoader";
import { Suspense } from "react";
import type { Metadata } from "next";
import Dashboard from "@/features/auth/Dashboard";
import { AUTH_COPY } from "@/config/auth";
export const metadata: Metadata = { title: "Security & access | Emcrown" };
export default function SecurityPage() {
  return <Suspense fallback={<PageLoader label={AUTH_COPY.loading} />}><Dashboard security /></Suspense>;
}
