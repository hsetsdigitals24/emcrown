// Shared policy: keep timings, permissions and editable portal copy together.
import type { AdminRole, Permission } from "@/types/auth";
export const AUTH_POLICY = {
  sessionSeconds: 8 * 60 * 60, challengeSeconds: 10 * 60,
  idleSeconds: 30 * 60, resetSeconds: 30 * 60, rateSeconds: 15 * 60,
  issuer: "Emcrown Physician Services",
} as const;
const permissions: Record<AdminRole, readonly Permission[]> = {
  super_admin: ["portal:read", "audit:read", "members:manage", "content:edit", "content:publish", "physicians:read", "physicians:manage", "appointments:read", "appointments:manage"],
  admin: ["portal:read", "audit:read", "content:edit", "content:publish", "physicians:read", "physicians:manage", "appointments:read", "appointments:manage"], staff: ["portal:read", "content:edit", "physicians:read", "appointments:read", "appointments:manage"],
};
export function hasPermission(role: AdminRole, permission: Permission) {
  return permissions[role].includes(permission);
}
export const AUTH_COPY = {
  brand: "Emcrown", eyebrow: "Organisation workspace", title: "Staff sign in",
  intro: "Secure access for authorised administrators and staff.",
  email: "Work email", password: "Password", newPassword: "New password",
  confirmPassword: "Confirm new password", code: "Authenticator code",
  login: "Sign in", forgot: "Forgot password?", forgotTitle: "Reset your password",
  forgotIntro: "Enter your account email. If eligible, we will email a reset link.",
  send: "Send reset link", resetTitle: "Choose a new password", reset: "Save password",
  passwordTitle: "Replace your temporary password",
  passwordHelp: "Use 12–128 characters. Do not reuse the temporary password.",
  mfaTitle: "Verify your identity", mfa: "Verify code",
  enrollTitle: "Set up your authenticator",
  enrollHelp: "Add this setup key to your authenticator app, then enter its six-digit code. Keep the key private.",
  enrollQrHelp: "Scan this QR code in your authenticator app, then enter the six-digit code it generates below.",
  enrollQrAlt: "QR code to add your Emcrown account to an authenticator app",
  enrollManual: "Cannot scan? Enter the setup key manually",
  enrollPrivate: "Keep the QR code and setup key private. You only need to add this account once.",
  backToMfa: "Back to authenticator verification", backToWebsite: "Back to website",
  backToWorkspace: "Back to workspace", backNavigation: "Back navigation",
  back: "Back to sign in", pending: "Please wait…", loading: "Loading secure workspace…",
  genericError: "We could not complete this request. Please try again.",
  invalid: "Check your details and try again.",
  resetSent: "If this account is eligible, a password reset link will be sent shortly.",
  resetDone: "Password updated. Sign in with your new password and authenticator.",
  unavailable: "Staff sign-in is awaiting secure configuration. Please contact your administrator.",
  dashboard: "Organisation overview", dashboardIntro: "Authentication and access controls are ready. Clinical and staff management features will be added here.",
  audit: "Activity log", auditIntro: "Recent activity for this organisation, recorded in UTC. Credentials and patient details are excluded.",
  auditColumns: ["Time (UTC)", "What happened", "Actor ID", "Role", "Result"],
  emptyAudit: "No activity recorded.", logout: "Sign out", role: "Your role",
  denied: "You do not have permission to access this area.", home: "Organisation home",
  errorTitle: "Workspace unavailable", retry: "Try again", notFound: "Workspace page not found",
  emailSubject: "Reset your Emcrown staff password",
  emailBody: "Use this link to reset your staff password. It expires in 30 minutes and can be used once. If you did not request this, ignore this email.",
} as const;
