// Server route: organisation-scoped, permission-checked audit viewer.
import WorkspaceLoading from "@/features/auth/WorkspaceLoading";
import { Suspense } from "react";
import type { Metadata } from "next";
import Dashboard from "@/features/auth/Dashboard";
export const metadata: Metadata = { title: "Activity log | Emcrown" };
export default function ActivityPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) { return <Suspense fallback={<WorkspaceLoading />}><Dashboard activity activityQuery={searchParams} /></Suspense>; }
