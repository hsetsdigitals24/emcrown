// Server route: organisation-scoped, permission-checked audit viewer.
import WorkspaceLoading from "@/features/auth/WorkspaceLoading";
import { Suspense } from "react";
import type { Metadata } from "next";
import Dashboard from "@/features/auth/Dashboard";
export const metadata: Metadata = { title: "Activity log | Emcrown" };
export default function ActivityPage() { return <Suspense fallback={<WorkspaceLoading />}><Dashboard activity /></Suspense>; }
