// Server route: authenticated organisation overview.
import PageLoader from "@/components/ui/PageLoader";
import { Suspense } from "react";
import type { Metadata } from "next";
import Dashboard from "@/features/auth/Dashboard";
import { AUTH_COPY } from "@/config/auth";
export const metadata: Metadata = { title: "Overview | Emcrown" };
export default function AdminPage() { return <Suspense fallback={<PageLoader label={AUTH_COPY.loading} />}><Dashboard /></Suspense>; }
