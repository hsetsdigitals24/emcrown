-- Operator-only setup: create emcrown_runtime with a private password separately.
-- Run with the migration owner, not from the application. Never use a superuser at runtime.
GRANT USAGE ON SCHEMA emcrown_admin TO emcrown_runtime;
GRANT SELECT ON emcrown_admin.organisations, emcrown_admin.memberships TO emcrown_runtime;
GRANT SELECT, UPDATE ON emcrown_admin.users TO emcrown_runtime;
GRANT SELECT, INSERT, UPDATE, DELETE ON emcrown_admin.sessions,
  emcrown_admin.reset_tokens, emcrown_admin.rate_limits, emcrown_admin.mail_outbox TO emcrown_runtime;
GRANT SELECT, INSERT ON emcrown_admin.audit_events TO emcrown_runtime;
REVOKE UPDATE, DELETE, TRUNCATE ON emcrown_admin.audit_events FROM emcrown_runtime;
-- Handover/recovery extension: roles and ownership remain read-only outside narrow functions.
GRANT INSERT ON emcrown_admin.users TO emcrown_runtime;
GRANT SELECT ON emcrown_admin.ownership TO emcrown_runtime;
GRANT SELECT, INSERT, UPDATE, DELETE ON emcrown_admin.invitations,
  emcrown_admin.recovery_codes TO emcrown_runtime;
GRANT EXECUTE ON FUNCTION emcrown_admin.accept_invitation(text),
  emcrown_admin.transfer_ownership(text, uuid) TO emcrown_runtime;
-- Website CMS: immutable revision history; runtime cannot delete documents or assets.
GRANT SELECT, INSERT, UPDATE ON emcrown_admin.cms_documents TO emcrown_runtime;
GRANT SELECT, INSERT ON emcrown_admin.cms_revisions, emcrown_admin.cms_media TO emcrown_runtime;
REVOKE UPDATE, DELETE, TRUNCATE ON emcrown_admin.cms_revisions FROM emcrown_runtime;

-- Clinical module: separate authenticated repositories enforce organisation/role checks.
GRANT SELECT, INSERT, UPDATE ON emcrown_admin.physicians,
  emcrown_admin.provider_schedules, emcrown_admin.appointments,
  emcrown_admin.appointment_messages TO emcrown_runtime;
GRANT SELECT, INSERT ON emcrown_admin.physician_documents,
  emcrown_admin.appointment_events TO emcrown_runtime;
GRANT SELECT, INSERT, UPDATE, DELETE ON emcrown_admin.appointment_tokens,
  emcrown_admin.sms_suppressions TO emcrown_runtime;
REVOKE UPDATE, DELETE, TRUNCATE ON emcrown_admin.appointment_events FROM emcrown_runtime;

-- Optional migration 0009: provider delivery outcomes are independent from queue state.
GRANT SELECT, INSERT, UPDATE ON emcrown_admin.notification_delivery TO emcrown_runtime;
