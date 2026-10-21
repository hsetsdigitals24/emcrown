// Server route: single-use invitation acceptance followed by mandatory MFA enrollment.
import { Suspense } from "react";
import type { Metadata } from "next";
import AuthScreen from "@/features/auth/AuthScreen";
export const metadata: Metadata = { title: "Accept invitation | Emcrown" };
export default function AcceptPage() { return <Suspense><AuthScreen mode="accept" /></Suspense>; }
