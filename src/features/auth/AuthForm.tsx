"use client";
// Client island: accessible forms with shared validation; no browser credential storage.
import { useActionState, useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { acceptAction, recoverAction } from "@/features/auth/security-actions";
import { HANDOVER_COPY } from "@/config/handover";
import Toast from "@/features/auth/Toast";
import { loginAction, forgotAction, resetAction, passwordAction, mfaAction } from "@/features/auth/actions";
import { loginSchema, forgotSchema, resetSchema, passwordSchema, mfaSchema, acceptSchema, recoverySchema } from "@/features/auth/validation";
import type { AuthMode, AuthState } from "@/types/auth";
import { AUTH_COPY } from "@/config/auth";
const actions = { login: loginAction, forgot: forgotAction, reset: resetAction, password: passwordAction, mfa: mfaAction, accept: acceptAction, recovery: recoverAction };
const schemas = { login: loginSchema, forgot: forgotSchema, reset: resetSchema, password: passwordSchema, mfa: mfaSchema, accept: acceptSchema, recovery: recoverySchema };
const labels = { login: AUTH_COPY.login, forgot: AUTH_COPY.send, reset: AUTH_COPY.reset, password: AUTH_COPY.reset, mfa: AUTH_COPY.mfa, accept: HANDOVER_COPY.accept, recovery: HANDOVER_COPY.recover };
const initial: AuthState = { message: "" };
const subscribe = () => () => {};
export default function AuthForm({ mode, blocked = false }: { mode: AuthMode; blocked?: boolean }) {
  const [state, action, pending] = useActionState(actions[mode], initial);
  const [token, setToken] = useState("");
  const [validation, setValidation] = useState("");
  const ready = useSyncExternalStore(subscribe, () => true, () => false);
  useEffect(() => {
    if ((mode === "reset" || mode === "accept")) {
      // Fragments never reach HTTP logs. Remove the secret before any navigation.
      const params = new URLSearchParams(window.location.hash.slice(1));
      const fragmentToken = params.get("token");
      window.history.replaceState(null, "", window.location.pathname);
      // Keep the browser-only fragment in component memory across hydration renders.
      if (fragmentToken) queueMicrotask(() => setToken(fragmentToken));
    }
  }, [mode]);
  const newPassword = mode === "reset" || mode === "password" || mode === "accept";
  return <form action={action} className="admin-form" onSubmit={event => {
    const result = schemas[mode].safeParse(Object.fromEntries(new FormData(event.currentTarget)));
    if (!result.success) { event.preventDefault(); setValidation(AUTH_COPY.invalid); }
    else setValidation("");
  }}>
    <fieldset disabled={blocked || !ready || pending || (state.success && (mode === "reset" || mode === "accept"))} className="admin-fields">
      {(mode === "login" || mode === "forgot") && <label>{AUTH_COPY.email}
        <input name="email" type="email" autoComplete="username" required maxLength={254} /></label>}
      {(mode === "login" || newPassword) && <label>{newPassword ? AUTH_COPY.newPassword : AUTH_COPY.password}
        <input name="password" type="password" autoComplete={newPassword ? "new-password" : "current-password"}
          required minLength={newPassword ? 12 : 1} maxLength={128} /></label>}
      {newPassword && <><p className="text-sm text-textSecondary" id="password-help">{AUTH_COPY.passwordHelp}</p>
        <label>{AUTH_COPY.confirmPassword}<input name="confirmPassword" type="password" autoComplete="new-password"
          required minLength={12} maxLength={128} aria-describedby="password-help" /></label></>}
      {mode === "mfa" && <label>{AUTH_COPY.code}<input name="code" inputMode="numeric" autoComplete="one-time-code"
        pattern="[0-9]{6}" minLength={6} maxLength={6} required /></label>}
      {(mode === "reset" || mode === "accept") && <input name="token" type="hidden" value={token} />}
      {mode === "recovery" && <label>{HANDOVER_COPY.recoveryCode}<input name="code" autoComplete="off" autoCapitalize="none" spellCheck={false} required maxLength={35} /></label>}
      <button className="admin-button" type="submit">{pending ? AUTH_COPY.pending : labels[mode]}</button>
    </fieldset>
    <Toast key={`${validation}:${state.message}`} message={validation || state.message} success={!validation && state.success} />
    {mode === "login" && <Link href="/emcrown-admin/forgot-password">{AUTH_COPY.forgot}</Link>}
    <noscript><p>{AUTH_COPY.unavailable}</p></noscript>
  </form>;
}
