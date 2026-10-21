// Shared policy and editable copy for one-time client handover and MFA recovery.
export const HANDOVER_POLICY = { invitationSeconds: 48 * 60 * 60, recoveryCodeCount: 10 } as const;
export const HANDOVER_COPY = {
  inviteTitle: "Invite a team member", inviteIntro: "Invite a new account using their work email. They choose their password and set up their own authenticator. Invitations expire after 48 hours.",
  invite: "Send invitation", email: "Work email", code: "Fresh authenticator code", pending: "Please wait…",
  sent: "Invitation queued. The scheduled mail worker must run to send it.",
  failed: "We could not complete this request. Check your details and use a fresh authenticator code.",
  transferTitle: "One-time ownership handover", transferIntro: "Select an active team member who has completed password and MFA setup. Confirm with your authenticator. Your organisation access will be disabled and this handover cannot be repeated.",
  refresh: "Refresh eligible accounts", target: "Incoming owner", choose: "Select an eligible account", confirm: "I understand that my access will be disabled and ownership transfer will be permanently locked.",
  transfer: "Transfer ownership permanently", locked: "Ownership handover is complete. Further ownership transfers are permanently disabled for this organisation.",
  noOwner: "Ownership management is unavailable for this account.", noCandidates: "No eligible account yet. Invite the incoming owner and ask them to finish password and MFA setup.",
  recoveryTitle: "Recovery codes", recoveryIntro: "Generate single-use codes with a fresh authenticator code. Save them privately. A new set replaces all previous codes. Codes are displayed only once.",
  generate: "Generate recovery codes", generated: "Save these recovery codes now. They will not be shown again.",
  recoveryLink: "Lost your authenticator?", recoverTitle: "Recover authenticator access", recoveryHelp: "After signing in with your password, enter a saved recovery code. All existing codes and sessions will be revoked, and you must set up a new authenticator.",
  recoveryCode: "Recovery code", recover: "Recover and set up new MFA", recovered: "Recovery verified.",
  acceptTitle: "Accept your invitation", acceptIntro: "Choose your password. You will then set up your own authenticator before entering the workspace.",
  signedInInvitation: "Sign out, then reopen the invitation link from your email to create the invited account.",
  accept: "Create account and set up MFA", password: "New password", confirmPassword: "Confirm password", acknowledge: "I have saved my codes privately", saveCodes: "Copy codes", copied: "Codes copied. Clear your clipboard after storing them securely.",
  ready: "MFA ready", members: "Team accounts", noMembers: "No team accounts available.",
  invitationSubject: "Your Emcrown staff invitation", invitationBody: "You have been invited to the Emcrown staff workspace. Choose your own password and set up your authenticator using this single-use link. It expires in 48 hours. If unexpected, ignore this email.",
} as const;
