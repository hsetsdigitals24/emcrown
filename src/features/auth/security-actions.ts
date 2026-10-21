"use server";
// Server actions: validate, rate-limit and reauthenticate every security mutation.
import { redirect } from "next/navigation";
import { mfaSchema, inviteSchema, transferSchema, acceptSchema, recoverySchema } from "@/features/auth/validation";
import { validateRequest } from "@/features/auth/request";
import { readSession, clearSessionCookie, setSessionCookie } from "@/features/auth/session";
import { generateRecoveryCodes, recoverAuthenticator } from "@/features/auth/recovery";
import { inviteMember, acceptInvitation } from "@/features/auth/invitations";
import { transferOwnership } from "@/features/auth/ownership";
import { rejected } from "@/features/auth/rejected";
import { HANDOVER_COPY as copy } from "@/config/handover";
import type { AuthState, SecurityState } from "@/types/auth";
const failed = { message: copy.failed };
async function allowed(scope: string) {
  const session = await readSession();
  return session && await validateRequest(scope, session.userId, 5);
}
export async function inviteAction(_: SecurityState, form: FormData): Promise<SecurityState> {
  const input = inviteSchema.safeParse(Object.fromEntries(form));
  if (!input.success) { await rejected("members.invited"); return failed; }
  try {
    if (!await allowed("invite") || !await inviteMember(input.data.email, input.data.code)) return failed;
    return { message: copy.sent, success: true };
  } catch { return failed; }
}
export async function codesAction(_: SecurityState, form: FormData): Promise<SecurityState> {
  const input = mfaSchema.safeParse(Object.fromEntries(form));
  if (!input.success) { await rejected("auth.recovery_generated"); return failed; }
  try {
    if (!await allowed("recovery-generate")) return failed;
    const codes = await generateRecoveryCodes(input.data.code);
    return codes ? { message: copy.generated, success: true, codes } : failed;
  } catch { return failed; }
}
export async function transferAction(_: SecurityState, form: FormData): Promise<SecurityState> {
  const input = transferSchema.safeParse(Object.fromEntries(form));
  if (!input.success) { await rejected("ownership.transferred"); return failed; }
  try {
    if (!await allowed("transfer") || !await transferOwnership(input.data.targetId, input.data.code)) return failed;
    await clearSessionCookie();
  } catch { return failed; }
  redirect("/emcrown-admin/login");
}
export async function acceptAction(_: AuthState, form: FormData): Promise<AuthState> {
  const input = acceptSchema.safeParse(Object.fromEntries(form));
  if (!input.success) { await rejected("members.accepted"); return failed; }
  try {
    if (!await validateRequest("accept", input.data.token, 5)) return failed;
    const session = await acceptInvitation(input.data.token, input.data.password);
    if (!session) return failed;
    await setSessionCookie(session);
  } catch { return failed; }
  redirect("/emcrown-admin/mfa");
}
export async function recoverAction(_: AuthState, form: FormData): Promise<AuthState> {
  const input = recoverySchema.safeParse(Object.fromEntries(form));
  if (!input.success) { await rejected("auth.recovered"); return failed; }
  try {
    if (!await allowed("recover")) return failed;
    const session = await recoverAuthenticator(input.data.code);
    if (!session) return failed;
    await setSessionCookie(session);
  } catch { return failed; }
  redirect("/emcrown-admin/mfa");
}
