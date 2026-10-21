// Server component: compose auth screens and enforce challenge stages before rendering secrets.
import { redirect } from "next/navigation";
import { connection } from "next/server";
import Link from "next/link";
import { HANDOVER_COPY } from "@/config/handover";
import { AUTH_COPY } from "@/config/auth";
import { authConfigured } from "@/lib/auth-env";
import { readSession, sessionDestination } from "@/features/auth/session";
import { decrypt } from "@/features/auth/crypto";
import AuthFrame from "@/features/auth/AuthFrame";
import AuthBackNav from "@/features/auth/AuthBackNav";
import AuthForm from "@/features/auth/AuthForm";
import MfaEnrollment from "@/features/auth/MfaEnrollment";
import { enrollmentQr } from "@/features/auth/enrollment-qr";
import { logoutAction } from "@/features/auth/actions";
import type { AuthMode } from "@/types/auth";
const titles = { login: AUTH_COPY.title, forgot: AUTH_COPY.forgotTitle, reset: AUTH_COPY.resetTitle,
  password: AUTH_COPY.passwordTitle, mfa: AUTH_COPY.mfaTitle, accept: HANDOVER_COPY.acceptTitle, recovery: HANDOVER_COPY.recoverTitle };
export default async function AuthScreen({ mode }: { mode: AuthMode }) {
  // Credential/session expiry checks must run for the current request, never prerender.
  await connection();
  if (!authConfigured()) return <AuthFrame><AuthBackNav mode={mode} /><h1>{titles[mode]}</h1><p>{AUTH_COPY.unavailable}</p>
    {!["password", "mfa", "recovery"].includes(mode) && <AuthForm mode={mode} />}</AuthFrame>;
  const session = await readSession();
  const challenge = mode === "password" || mode === "mfa" || mode === "recovery";
  if (challenge && !session) redirect("/emcrown-admin/login");
  if (session && mode === "login") redirect(sessionDestination(session.stage));
  if (session && challenge && ((mode === "password" && session.stage !== "password") ||
    (mode === "mfa" && !["enroll", "mfa"].includes(session.stage)) || (mode === "recovery" && session.stage !== "mfa"))) redirect(sessionDestination(session.stage));
  const enrollment = mode === "mfa" && session?.stage === "enroll" && session.enrollmentSecret;
  const setupKey = enrollment ? decrypt(enrollment) : undefined;
  const qrDataUrl = setupKey && session ? await enrollmentQr(setupKey, session.email) : undefined;
  return <AuthFrame>
    <AuthBackNav mode={mode} stage={session?.stage} />
    <p className="text-sm font-semibold uppercase tracking-widest text-primary">{AUTH_COPY.eyebrow}</p>
    <h1>{enrollment ? AUTH_COPY.enrollTitle : titles[mode]}</h1>
    <p className="text-textSecondary">{mode === "forgot" ? AUTH_COPY.forgotIntro : mode === "login" ? AUTH_COPY.intro : ""}</p>
    {setupKey && <MfaEnrollment setupKey={setupKey} qrDataUrl={qrDataUrl} />}
    {mode === "accept" && <p>{HANDOVER_COPY.acceptIntro}</p>}
    {mode === "recovery" && <p>{HANDOVER_COPY.recoveryHelp}</p>}
    {mode === "accept" && session && <><p role="status">{HANDOVER_COPY.signedInInvitation}</p><form action={logoutAction}><button className="admin-button">{AUTH_COPY.logout}</button></form></>}
    <AuthForm mode={mode} blocked={mode === "accept" && Boolean(session)} />
    {mode === "mfa" && session?.stage === "mfa" && <Link className="workspace-text-link" href="/emcrown-admin/recover">{HANDOVER_COPY.recoveryLink}</Link>}
    {mode === "recovery" && <form action={logoutAction} className="mt-4"><button className="admin-button" type="submit">{AUTH_COPY.logout}</button></form>}
  </AuthFrame>;
}
