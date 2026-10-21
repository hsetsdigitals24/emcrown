// Shared contracts: organisation permissions and safe form responses.
export const ADMIN_ROLES = ["super_admin", "admin", "staff"] as const;
export type AdminRole = typeof ADMIN_ROLES[number];
export type Permission = "portal:read" | "audit:read" | "members:manage" | "content:edit" | "content:publish" | "physicians:read" | "physicians:manage" | "appointments:read" | "appointments:manage";
export type AuthState = { message: string; success?: boolean };
export type AuthMode = "login" | "forgot" | "reset" | "password" | "mfa" | "accept" | "recovery";
export type SessionStage = "password" | "enroll" | "mfa" | "full";
export const AUDIT_ACTIONS = [
  "organisation.seeded", "auth.login", "auth.logout", "auth.password_changed",
  "auth.reset_requested", "auth.reset_completed", "auth.reset_email",
  "auth.mfa_enrolled", "auth.mfa_verified", "auth.rate_limited",
  "portal.viewed", "audit.viewed", "access.denied",
  "members.invited", "members.accepted", "ownership.transferred",
  "auth.recovery_generated", "auth.recovered", "auth.invitation_email",
] as const;
export type AuditAction = typeof AUDIT_ACTIONS[number];

export type SecurityState = AuthState & { codes?: string[] };
