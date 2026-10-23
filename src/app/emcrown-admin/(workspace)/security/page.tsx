// Server route: authenticated security overview.
import WorkspaceLoading from "@/features/auth/WorkspaceLoading";
import { Suspense } from "react";
import type { Metadata } from "next";
import Dashboard from "@/features/auth/Dashboard";
export const metadata: Metadata = { title: "Security & access | Emcrown" };
export default function SecurityPage() {
  return <Suspense fallback={<WorkspaceLoading />}><Dashboard security /></Suspense>;
}
