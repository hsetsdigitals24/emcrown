-- Backfill only unambiguous existing organisations; ambiguous ownership fails closed.
INSERT INTO emcrown_admin.ownership (organisation_id, owner_id)
SELECT organisation_id, (array_agg(user_id))[1] FROM emcrown_admin.memberships
WHERE role = 'super_admin' AND active GROUP BY organisation_id HAVING count(*) = 1
ON CONFLICT DO NOTHING;
--> statement-breakpoint
CREATE FUNCTION emcrown_admin.accept_invitation(invite_hash text) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, emcrown_admin AS $$
DECLARE invitation emcrown_admin.invitations%ROWTYPE;
BEGIN
  SELECT * INTO invitation FROM emcrown_admin.invitations WHERE token_hash = invite_hash AND expires_at > now() FOR UPDATE;
  IF NOT FOUND THEN RETURN false; END IF;
  PERFORM 1 FROM emcrown_admin.users WHERE id = invitation.user_id AND NOT active AND mfa_secret IS NULL FOR UPDATE;
  IF NOT FOUND THEN RETURN false; END IF;
  INSERT INTO emcrown_admin.memberships (organisation_id, user_id, role, active)
  VALUES (invitation.organisation_id, invitation.user_id, 'staff', true);
  DELETE FROM emcrown_admin.invitations WHERE token_hash = invite_hash;
  RETURN true;
END $$;
--> statement-breakpoint
REVOKE ALL ON FUNCTION emcrown_admin.accept_invitation(text) FROM PUBLIC;
--> statement-breakpoint
CREATE FUNCTION emcrown_admin.transfer_ownership(session_hash text, target_id uuid) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, emcrown_admin AS $$
DECLARE actor emcrown_admin.sessions%ROWTYPE; current_owner emcrown_admin.ownership%ROWTYPE;
BEGIN
  SELECT * INTO actor FROM emcrown_admin.sessions WHERE token_hash = session_hash AND stage = 'full'
    AND expires_at > now() AND last_seen_at > now() - interval '30 minutes';
  IF NOT FOUND OR actor.user_id = target_id THEN RETURN false; END IF;
  SELECT * INTO current_owner FROM emcrown_admin.ownership WHERE organisation_id = actor.organisation_id FOR UPDATE;
  IF NOT FOUND OR current_owner.owner_id <> actor.user_id OR current_owner.transferred_at IS NOT NULL THEN RETURN false; END IF;
  PERFORM 1 FROM emcrown_admin.memberships m JOIN emcrown_admin.users u ON u.id = m.user_id
    WHERE m.organisation_id = actor.organisation_id AND m.user_id = actor.user_id AND m.role = 'super_admin'
      AND m.active AND u.active AND NOT u.must_change_password AND u.mfa_secret IS NOT NULL
      AND u.last_mfa_step >= floor(extract(epoch FROM clock_timestamp()) / 30)::bigint - 1;
  IF NOT FOUND THEN RETURN false; END IF;
  PERFORM 1 FROM emcrown_admin.memberships m JOIN emcrown_admin.users u ON u.id = m.user_id
    WHERE m.organisation_id = actor.organisation_id AND m.user_id = target_id AND m.active
      AND u.active AND NOT u.must_change_password AND u.mfa_secret IS NOT NULL FOR UPDATE OF m, u;
  IF NOT FOUND THEN RETURN false; END IF;
  UPDATE emcrown_admin.memberships SET role = 'super_admin' WHERE organisation_id = actor.organisation_id AND user_id = target_id;
  UPDATE emcrown_admin.memberships SET role = 'admin', active = false WHERE organisation_id = actor.organisation_id AND user_id = actor.user_id;
  UPDATE emcrown_admin.ownership SET owner_id = target_id, transferred_at = clock_timestamp() WHERE organisation_id = actor.organisation_id;
  DELETE FROM emcrown_admin.sessions WHERE organisation_id = actor.organisation_id AND user_id IN (actor.user_id, target_id);
  INSERT INTO emcrown_admin.audit_events (organisation_id, actor_id, actor_role, action, outcome)
    VALUES (actor.organisation_id, actor.user_id, 'super_admin', 'ownership.transferred', 'success'),
      (actor.organisation_id, target_id, 'super_admin', 'ownership.transferred', 'success');
  RETURN true;
END $$;
--> statement-breakpoint
REVOKE ALL ON FUNCTION emcrown_admin.transfer_ownership(text, uuid) FROM PUBLIC;
--> statement-breakpoint
CREATE FUNCTION emcrown_admin.protect_ownership_latch() RETURNS trigger
LANGUAGE plpgsql SET search_path = pg_catalog, emcrown_admin AS $$
BEGIN
  IF TG_OP = 'DELETE' OR OLD.transferred_at IS NOT NULL THEN
    RAISE EXCEPTION 'Ownership handover is permanently locked';
  END IF;
  IF NEW.transferred_at IS NULL OR NEW.owner_id = OLD.owner_id THEN
    RAISE EXCEPTION 'Invalid ownership handover';
  END IF;
  RETURN NEW;
END $$;
--> statement-breakpoint
CREATE TRIGGER ownership_latch BEFORE UPDATE OR DELETE ON emcrown_admin.ownership
FOR EACH ROW EXECUTE FUNCTION emcrown_admin.protect_ownership_latch();
