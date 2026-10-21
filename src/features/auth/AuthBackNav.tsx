// Server component: stage-aware back navigation without browser-history loops or MFA bypasses.
import Link from "next/link";
import { logoutAction } from "@/features/auth/actions";
import { AUTH_COPY } from "@/config/auth";
import { sessionDestination } from "@/features/auth/session";
import type { AuthMode, SessionStage } from "@/types/auth";
export default function AuthBackNav({ mode, stage }: { mode: AuthMode; stage?: SessionStage }) {
  // Leaving a password/MFA challenge must clear its session before returning to sign-in.
  if (stage && (mode === "password" || mode === "mfa")) return <form action={logoutAction} className="auth-back-nav">
    <button type="submit" className="auth-back-link"><span aria-hidden="true">←</span>{AUTH_COPY.back}</button>
  </form>;
  const href = mode === "recovery" ? "/emcrown-admin/mfa" : mode === "login" ? "/"
    : stage ? sessionDestination(stage) : "/emcrown-admin/login";
  const label = mode === "recovery" ? AUTH_COPY.backToMfa : mode === "login" ? AUTH_COPY.backToWebsite
    : stage ? AUTH_COPY.backToWorkspace : AUTH_COPY.back;
  return <nav className="auth-back-nav" aria-label={AUTH_COPY.backNavigation}><Link href={href} className="auth-back-link">
    <span aria-hidden="true">←</span>{label}</Link></nav>;
}
