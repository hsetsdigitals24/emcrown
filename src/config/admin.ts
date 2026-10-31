// Shared configuration: editable workspace navigation and dashboard text.
export const ADMIN_COPY = {
  dismissConfirmation: "Go back",
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
  { href: "/emcrown-admin/practice", label: "Practice details", icon: "⌖", permission: "content:edit" as const },
  { href: "/emcrown-admin/cms", label: "Website CMS", icon: "▤", permission: "content:edit" as const },
  { href: "/emcrown-admin/physicians", label: "Physicians", icon: "♧", permission: "physicians:read" as const },
  { href: "/emcrown-admin/appointments", label: "Appointments", icon: "▦", permission: "appointments:read" as const },
  { href: "/emcrown-admin/notifications", label: "Notifications", icon: "◉", permission: "appointments:read" as const },
  { href: "/emcrown-admin/activity", label: ADMIN_COPY.activity, icon: "↗", permission: "audit:read" as const },
  { href: "/emcrown-admin/security", label: ADMIN_COPY.security, icon: "◇" },
];

// Timed notices leave enough time to read errors; hover/focus pauses dismissal.
export const TOAST_POLICY = { successMs: 5000, errorMs: 8000, exitMs: 220 };

// Overview summaries describe available tools without implying live booking activation.
export const OVERVIEW_COPY = {
  eyebrow: "Your practice, connected",
  title: "Everything you manage. One workspace.",
  intro: "Keep your website current, organise your physician team and manage appointments from one place.",
  quick: "Quick access", quickBody: "Choose a workspace to pick up where you need to.",
  open: "Open workspace", account: "Your session", accountBody: "Signed in with password and authenticator verification.",
  websiteBody: "See how your published content appears to visitors.",
} as const;
export const OVERVIEW_TOOLS = [
  { href: "/emcrown-admin/notifications", icon: "↗", label: "Notifications", eyebrow: "Updates & follow-up", description: "See new booking requests, appointment changes and messages that need attention.", highlights: ["Booking alerts", "Message failures"], action: "View notifications", permission: "appointments:read" },
  { href: "/emcrown-admin/practice", icon: "⌖", label: "Practice details", eyebrow: "Address & visitor information", description: "Update the shared practice address, hours and location map used across the website.", highlights: ["Practice address", "Live location map"], action: "Edit practice details", permission: "content:edit" },
  { href: "/emcrown-admin/appointments", icon: "▦", label: "Appointments", eyebrow: "Visits & availability", description: "Review appointment requests, manage visits and maintain physician availability.", highlights: ["Appointment inbox", "Weekly hours & time off"], action: "Manage appointments", permission: "appointments:read" },
  { href: "/emcrown-admin/cms", icon: "▤", label: "Website CMS", eyebrow: "Content & publishing", description: "Update website pages, review your changes and publish content for your visitors.", highlights: ["Page content & images", "Preview & publishing"], action: "Edit website content", permission: "content:edit" },
  { href: "/emcrown-admin/physicians", icon: "♧", label: "Physicians", eyebrow: "Your physician team", description: "Maintain physician profiles, review biographies and manage public profile visibility.", highlights: ["Profiles & portraits", "Public biographies"], action: "View physicians", permission: "physicians:read" },
  { href: "/emcrown-admin/activity", icon: "↗", label: "Activity log", eyebrow: "Workspace history", description: "Review recorded sign-in, access and account events with their outcomes and timestamps.", highlights: ["Recorded events", "Action outcomes"], action: "Review activity", permission: "audit:read" },
  { href: "/emcrown-admin/security", icon: "◇", label: "Security & access", eyebrow: "Account protection", description: "Find password and authenticator recovery options and review account access tools.", highlights: ["Password assistance", "Authenticator recovery"], action: "Review security", permission: "portal:read" },
] as const;
