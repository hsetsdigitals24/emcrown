// Server route: authenticated organisation overview.
import WorkspaceLoading from "@/features/auth/WorkspaceLoading";
import { Suspense } from "react";
import type { Metadata } from "next";
import Dashboard from "@/features/auth/Dashboard";
export const metadata: Metadata = { title: "Overview | Emcrown" };
export default function AdminPage() { return <Suspense fallback={<WorkspaceLoading />}><Dashboard /></Suspense>; }
