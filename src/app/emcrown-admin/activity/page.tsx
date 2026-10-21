// Server route: organisation-scoped, permission-checked audit viewer.
import PageLoader from "@/components/ui/PageLoader";
import { Suspense } from "react";
import type { Metadata } from "next";
import Dashboard from "@/features/auth/Dashboard";
import { AUTH_COPY } from "@/config/auth";
export const metadata: Metadata = { title: "Activity log | Emcrown" };
export default function ActivityPage() { return <Suspense fallback={<PageLoader label={AUTH_COPY.loading} />}><Dashboard activity /></Suspense>; }
