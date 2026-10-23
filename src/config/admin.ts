// Shared configuration: editable workspace navigation and dashboard text.
export const ADMIN_COPY = {
  loadingPage: "Loading workspace page…",
  hideSidebar: "Hide sidebar", showSidebar: "Show sidebar",
  breadcrumb: "Workspace breadcrumb", workspace: "Practice workspace", overview: "Overview", activity: "Activity log",
  security: "Security & access", navigation: "Workspace navigation", menu: "Toggle navigation", closeMenu: "Close navigation",
  welcome: "A clearer view of your practice.", intro: "Your secure home for organisation access and system activity.",
  signedIn: "Signed in securely", protected: "Multi-factor authentication", protectedBody: "Your session is protected by your password and authenticator.",
  access: "Your workspace access", accessBody: "Permissions are checked on the server for every protected request.",
  next: "Make yourself at home", nextBody: "Review organisation activity or manage your sign-in details from one place.",
  viewActivity: "Review activity", settings: "Review security", publicSite: "View public website",
  clinical: "Clinical tools", clinicalBody: "Manage physicians, schedules and appointment requests from your workspace.",
  planned: "Planned", securityTitle: "Keep access in the right hands.",
  password: "Password assistance", passwordBody: "Request a time-limited reset link. Your authenticator is still required after a password reset.",
  reset: "Request password reset", recovery: "Authenticator recovery", recoveryBody: "Saved recovery codes restore access after password verification and require setting up a new authenticator.",
  ownership: "Invitations & ownership", ownershipBody: "Invite an account, verify its MFA setup, then complete the organisation’s one-time ownership handover.",
  delivery: "Reset email delivery", deliveryBody: "SMTP acceptance is recorded in the activity log. It does not prove inbox delivery. The mail worker must be scheduled by the hosting operator.",
  dismiss: "Dismiss notification", success: "Request completed", error: "Action needed", notifications: "System notification",
} as const;
export const ADMIN_NAV = [
  { href: "/emcrown-admin", label: ADMIN_COPY.overview, icon: "◫" },
  { href: "/emcrown-admin/cms", label: "Website CMS", icon: "▤", permission: "content:edit" as const },
  { href: "/emcrown-admin/physicians", label: "Physicians", icon: "♧", permission: "physicians:read" as const },
  { href: "/emcrown-admin/appointments", label: "Appointments", icon: "▦", permission: "appointments:read" as const },
  { href: "/emcrown-admin/activity", label: ADMIN_COPY.activity, icon: "↗", permission: "audit:read" as const },
  { href: "/emcrown-admin/security", label: ADMIN_COPY.security, icon: "◇" },
];

// Timed notices leave enough time to read errors; hover/focus pauses dismissal.
export const TOAST_POLICY = { successMs: 5000, errorMs: 8000, exitMs: 220 };
