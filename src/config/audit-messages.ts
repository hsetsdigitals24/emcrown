// Shared audit wording: describe recorded outcomes without guessing identities or failure causes.
import type { AuditAction } from "@/types/auth";
type EventMessages = { success: string; failure: string; denied: string };
export const AUDIT_MESSAGES: Record<AuditAction, EventMessages> = {
  "organisation.seeded": {
    success: "Created the organisation and its initial owner account.",
    failure: "Organisation setup did not complete.", denied: "Organisation setup was blocked.",
  },
  "auth.login": {
    success: "Password accepted; further sign-in checks are required.",
    failure: "Password sign-in was not accepted.", denied: "The sign-in attempt was blocked.",
  },
  "auth.logout": {
    success: "Signed out of the workspace.", failure: "Sign-out did not complete.", denied: "The sign-out request was blocked.",
  },
  "auth.password_changed": {
    success: "Changed the account password and continued security setup.",
    failure: "The password change did not complete.", denied: "The password change was not authorised.",
  },
  "auth.reset_requested": {
    success: "Received a password-reset request; account eligibility is not disclosed.",
    failure: "The password-reset request did not complete.", denied: "The password-reset request was blocked.",
  },
  "auth.reset_completed": {
    success: "Reset the password and revoked existing sign-in sessions.",
    failure: "The password reset did not complete.", denied: "The password reset was blocked.",
  },
  "auth.reset_email": {
    success: "The mail server accepted a password-reset email; inbox delivery is unconfirmed.",
    failure: "The mail server did not confirm acceptance of the password-reset email.", denied: "Sending the password-reset email was blocked.",
  },
  "auth.mfa_enrolled": {
    success: "Set up an authenticator for the account.",
    failure: "Authenticator setup did not complete.", denied: "Authenticator setup was not authorised.",
  },
  "auth.mfa_verified": {
    success: "Verified an authenticator code and completed sign-in.",
    failure: "The authenticator code was not accepted.", denied: "Authenticator verification was blocked.",
  },
  "auth.rate_limited": {
    success: "Recorded a request-limit check.",
    failure: "The request-limit check did not complete.", denied: "Blocked a request because too many attempts were made.",
  },
  "portal.viewed": {
    success: "Opened a protected workspace page.",
    failure: "The workspace page could not be opened.", denied: "Access to a workspace page was blocked.",
  },
  "audit.viewed": {
    success: "Opened the organisation’s activity log.",
    failure: "The activity log could not be opened.", denied: "Access to the activity log was blocked.",
  },
  "access.denied": {
    success: "Recorded an access-control event.",
    failure: "The access check did not complete.", denied: "Blocked access because the account lacked the required permission.",
  },
  "members.invited": {
    success: "Created a staff invitation and queued its email for sending.",
    failure: "The staff invitation could not be created.", denied: "The staff invitation was not authorised.",
  },
  "members.accepted": {
    success: "Accepted a staff invitation and began authenticator setup.",
    failure: "The staff invitation could not be accepted.", denied: "Accepting the staff invitation was blocked.",
  },
  "ownership.transferred": {
    success: "Transferred organisation ownership and disabled the former owner’s access.",
    failure: "The ownership handover did not complete.", denied: "The ownership handover was not authorised or no longer available.",
  },
  "auth.recovery_generated": {
    success: "Generated new recovery codes and replaced the previous set.",
    failure: "Recovery codes could not be generated.", denied: "Generating recovery codes was not authorised.",
  },
  "auth.recovered": {
    success: "Used a recovery code; revoked sessions and required a new authenticator setup.",
    failure: "The recovery code was not accepted.", denied: "Authenticator recovery was blocked.",
  },
  "auth.invitation_email": {
    success: "The mail server accepted a staff invitation email; inbox delivery is unconfirmed.",
    failure: "The mail server did not confirm acceptance of the staff invitation email.", denied: "Sending the staff invitation email was blocked.",
  },
};
export const AUDIT_DISPLAY = {
  fallback: "Recorded an organisation activity event.",
  outcomes: { success: "Completed", failure: "Unsuccessful", denied: "Blocked" },
};
