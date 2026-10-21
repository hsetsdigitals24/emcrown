// Server route: password-verified recovery challenge with single-use backup codes.
import { Suspense } from "react";
import type { Metadata } from "next";
import AuthScreen from "@/features/auth/AuthScreen";
export const metadata: Metadata = { title: "Recover authenticator | Emcrown" };
export default function RecoverPage() { return <Suspense><AuthScreen mode="recovery" /></Suspense>; }
