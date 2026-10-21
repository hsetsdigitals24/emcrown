-- Custom SQL migration file, put your code below! --
-- Server-owned schema is never available through Supabase's browser API roles.
REVOKE ALL ON SCHEMA emcrown_admin FROM PUBLIC;
--> statement-breakpoint
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON SCHEMA emcrown_admin FROM anon;
    REVOKE ALL ON ALL TABLES IN SCHEMA emcrown_admin FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON SCHEMA emcrown_admin FROM authenticated;
    REVOKE ALL ON ALL TABLES IN SCHEMA emcrown_admin FROM authenticated;
  END IF;
END $$;
--> statement-breakpoint
CREATE FUNCTION emcrown_admin.reject_audit_mutation() RETURNS trigger
LANGUAGE plpgsql AS $$ BEGIN
  RAISE EXCEPTION 'Audit events are append-only';
END $$;
--> statement-breakpoint
CREATE TRIGGER audit_events_immutable
BEFORE UPDATE OR DELETE OR TRUNCATE ON emcrown_admin.audit_events
FOR EACH STATEMENT EXECUTE FUNCTION emcrown_admin.reject_audit_mutation();
--> statement-breakpoint
-- Encrypted MFA material must be present before an MFA/full session is created.
ALTER TABLE emcrown_admin.sessions ADD CONSTRAINT enrollment_secret_required
CHECK ((stage = 'enroll' AND enrollment_secret IS NOT NULL) OR (stage <> 'enroll' AND enrollment_secret IS NULL));
