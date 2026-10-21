"use server";
// Server actions: validate all untrusted input before invoking modular auth services.
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { AUTH_COPY } from "@/config/auth";
import { loginSchema, forgotSchema, resetSchema, passwordSchema, mfaSchema } from "@/features/auth/validation";
import { validateRequest } from "@/features/auth/request";
import { login } from "@/features/auth/login";
import { requestReset, resetPassword } from "@/features/auth/passwords";
import { changeTemporaryPassword, verifyMfa } from "@/features/auth/challenges";
import { readSession, setSessionCookie, clearSessionCookie, sessionDestination } from "@/features/auth/session";
import { db } from "@/lib/db";
import { sessions } from "@/lib/db/schema";
import { audit } from "@/features/auth/audit";
import { rejected } from "@/features/auth/rejected";
import type { AuthState } from "@/types/auth";
const invalid = { message: AUTH_COPY.invalid };
const failed = { message: AUTH_COPY.genericError };
export async function loginAction(_: AuthState, form: FormData): Promise<AuthState> {
  const input = loginSchema.safeParse(Object.fromEntries(form));
  if (!input.success) { await rejected("auth.login"); return invalid; }
  let destination: string;
  try {
    if (!await validateRequest("login", input.data.email, 10)) return invalid;
    const result = await login(input.data.email, input.data.password);
    if (!result) return invalid;
    await setSessionCookie(result); destination = sessionDestination(result.stage);
  } catch { return failed; }
  redirect(destination);
}
export async function forgotAction(_: AuthState, form: FormData): Promise<AuthState> {
  const input = forgotSchema.safeParse(Object.fromEntries(form));
  if (!input.success) { await rejected("auth.reset_requested"); return invalid; }
  try {
    if (await validateRequest("forgot", input.data.email, 3)) await requestReset(input.data.email);
  } catch { return failed; }
  return { message: AUTH_COPY.resetSent, success: true };
}
export async function resetAction(_: AuthState, form: FormData): Promise<AuthState> {
  const input = resetSchema.safeParse(Object.fromEntries(form));
  if (!input.success) { await rejected("auth.reset_completed"); return invalid; }
  try {
    if (!await validateRequest("reset", input.data.token, 5)) return invalid;
    if (!await resetPassword(input.data.token, input.data.password)) return invalid;
    await clearSessionCookie();
  } catch { return failed; }
  return { message: AUTH_COPY.resetDone, success: true };
}
export async function passwordAction(_: AuthState, form: FormData): Promise<AuthState> {
  const input = passwordSchema.safeParse(Object.fromEntries(form));
  if (!input.success) { await rejected("auth.password_changed"); return invalid; }
  let destination: string;
  try {
    const session = await readSession();
    if (!session || !await validateRequest("password", session.userId, 5)) return invalid;
    const result = await changeTemporaryPassword(input.data.password);
    if (!result) return invalid;
    await setSessionCookie(result); destination = sessionDestination(result.stage);
  } catch { return failed; }
  redirect(destination);
}
export async function mfaAction(_: AuthState, form: FormData): Promise<AuthState> {
  const input = mfaSchema.safeParse(Object.fromEntries(form));
  if (!input.success) { await rejected("auth.mfa_verified"); return invalid; }
  try {
    const session = await readSession();
    if (!session || !await validateRequest("mfa", session.userId, 5)) return invalid;
    const result = await verifyMfa(input.data.code);
    if (!result) return invalid;
    await setSessionCookie(result);
  } catch { return failed; }
  redirect("/emcrown-admin");
}
export async function logoutAction() {
  try {
    const session = await readSession();
    if (!session || !await validateRequest("logout", session.userId, 30)) return;
    await db().transaction(async tx => {
      await tx.delete(sessions).where(eq(sessions.tokenHash, session.tokenHash));
      await audit(tx, "auth.logout", "success", session);
    });
    await clearSessionCookie();
  } catch { return; }
  redirect("/emcrown-admin/login");
}
