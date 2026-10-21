CREATE TABLE "emcrown_admin"."appointment_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organisation_id" uuid NOT NULL,
	"appointment_id" uuid,
	"actor_id" uuid,
	"action" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "emcrown_admin"."appointment_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organisation_id" uuid NOT NULL,
	"appointment_id" uuid NOT NULL,
	"appointment_version" integer NOT NULL,
	"channel" text NOT NULL,
	"kind" text NOT NULL,
	"payload" text NOT NULL,
	"available_at" timestamp with time zone NOT NULL,
	"state" text DEFAULT 'queued' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"provider_id" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "appointment_message_once" UNIQUE("appointment_id","appointment_version","channel","kind"),
	CONSTRAINT "appointment_message_state" CHECK ("emcrown_admin"."appointment_messages"."state" in ('queued', 'sending', 'sent', 'failed', 'cancelled'))
);
--> statement-breakpoint
CREATE TABLE "emcrown_admin"."appointment_tokens" (
	"token_hash" text PRIMARY KEY NOT NULL,
	"organisation_id" uuid NOT NULL,
	"appointment_id" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"version" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "emcrown_admin"."appointments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organisation_id" uuid NOT NULL,
	"physician_id" uuid NOT NULL,
	"location_id" text NOT NULL,
	"type_id" text NOT NULL,
	"start_at" timestamp with time zone NOT NULL,
	"end_at" timestamp with time zone NOT NULL,
	"occupied_until" timestamp with time zone NOT NULL,
	"status" text DEFAULT 'requested' NOT NULL,
	"patient" text NOT NULL,
	"idempotency_key" uuid NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "booking_idempotency" UNIQUE("organisation_id","idempotency_key"),
	CONSTRAINT "appointment_tenant_id" UNIQUE("organisation_id","id"),
	CONSTRAINT "appointment_status" CHECK ("emcrown_admin"."appointments"."status" in ('requested', 'confirmed', 'cancelled', 'completed', 'no_show')),
	CONSTRAINT "appointment_time" CHECK ("emcrown_admin"."appointments"."start_at" < "emcrown_admin"."appointments"."end_at" and "emcrown_admin"."appointments"."end_at" <= "emcrown_admin"."appointments"."occupied_until"),
	CONSTRAINT "appointment_version" CHECK ("emcrown_admin"."appointments"."version" > 0)
);
--> statement-breakpoint
CREATE TABLE "emcrown_admin"."physician_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organisation_id" uuid NOT NULL,
	"physician_id" uuid NOT NULL,
	"object_path" text NOT NULL,
	"metadata" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "emcrown_admin"."physicians" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organisation_id" uuid NOT NULL,
	"profile" text NOT NULL,
	"publication" text,
	"slug" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "physician_tenant_id" UNIQUE("organisation_id","id"),
	CONSTRAINT "physician_slug" UNIQUE("organisation_id","slug"),
	CONSTRAINT "physician_version" CHECK ("emcrown_admin"."physicians"."version" > 0)
);
--> statement-breakpoint
CREATE TABLE "emcrown_admin"."provider_schedules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organisation_id" uuid NOT NULL,
	"physician_id" uuid NOT NULL,
	"definition" jsonb NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "schedule_scope" UNIQUE("organisation_id","physician_id","id")
);
--> statement-breakpoint
CREATE TABLE "emcrown_admin"."sms_suppressions" (
	"organisation_id" uuid NOT NULL,
	"phone_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sms_suppressions_organisation_id_phone_hash_pk" PRIMARY KEY("organisation_id","phone_hash")
);
--> statement-breakpoint
ALTER TABLE "emcrown_admin"."appointment_events" ADD CONSTRAINT "appointment_events_organisation_id_organisations_id_fk" FOREIGN KEY ("organisation_id") REFERENCES "emcrown_admin"."organisations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "emcrown_admin"."appointment_events" ADD CONSTRAINT "appointment_events_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "emcrown_admin"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "emcrown_admin"."appointment_messages" ADD CONSTRAINT "appointment_messages_organisation_id_appointment_id_appointments_organisation_id_id_fk" FOREIGN KEY ("organisation_id","appointment_id") REFERENCES "emcrown_admin"."appointments"("organisation_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "emcrown_admin"."appointment_tokens" ADD CONSTRAINT "appointment_tokens_organisation_id_appointment_id_appointments_organisation_id_id_fk" FOREIGN KEY ("organisation_id","appointment_id") REFERENCES "emcrown_admin"."appointments"("organisation_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "emcrown_admin"."appointments" ADD CONSTRAINT "appointments_organisation_id_physician_id_physicians_organisation_id_id_fk" FOREIGN KEY ("organisation_id","physician_id") REFERENCES "emcrown_admin"."physicians"("organisation_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "emcrown_admin"."physician_documents" ADD CONSTRAINT "physician_documents_organisation_id_physician_id_physicians_organisation_id_id_fk" FOREIGN KEY ("organisation_id","physician_id") REFERENCES "emcrown_admin"."physicians"("organisation_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "emcrown_admin"."physicians" ADD CONSTRAINT "physicians_organisation_id_organisations_id_fk" FOREIGN KEY ("organisation_id") REFERENCES "emcrown_admin"."organisations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "emcrown_admin"."provider_schedules" ADD CONSTRAINT "provider_schedules_organisation_id_physician_id_physicians_organisation_id_id_fk" FOREIGN KEY ("organisation_id","physician_id") REFERENCES "emcrown_admin"."physicians"("organisation_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "emcrown_admin"."sms_suppressions" ADD CONSTRAINT "sms_suppressions_organisation_id_organisations_id_fk" FOREIGN KEY ("organisation_id") REFERENCES "emcrown_admin"."organisations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "clinical_event_time" ON "emcrown_admin"."appointment_events" USING btree ("organisation_id","created_at");--> statement-breakpoint
CREATE INDEX "appointment_date" ON "emcrown_admin"."appointments" USING btree ("organisation_id","start_at");--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS btree_gist;
--> statement-breakpoint
ALTER TABLE emcrown_admin.appointments ADD CONSTRAINT appointments_no_overlap
EXCLUDE USING gist (physician_id WITH =, tstzrange(start_at, occupied_until, '[)') WITH &&)
WHERE (status IN ('requested', 'confirmed'));
--> statement-breakpoint
CREATE TRIGGER clinical_events_immutable
BEFORE UPDATE OR DELETE OR TRUNCATE ON emcrown_admin.appointment_events
FOR EACH STATEMENT EXECUTE FUNCTION emcrown_admin.reject_audit_mutation();
--> statement-breakpoint
DO $$
DECLARE tab text;
BEGIN
  FOREACH tab IN ARRAY ARRAY['physicians','physician_documents','provider_schedules','appointments','appointment_events','appointment_messages','appointment_tokens','sms_suppressions'] LOOP
    EXECUTE format('REVOKE ALL ON emcrown_admin.%I FROM PUBLIC', tab);
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
      EXECUTE format('REVOKE ALL ON emcrown_admin.%I FROM anon', tab);
    END IF;
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
      EXECUTE format('REVOKE ALL ON emcrown_admin.%I FROM authenticated', tab);
    END IF;
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'emcrown_runtime') THEN
      EXECUTE format('GRANT SELECT, INSERT, UPDATE ON emcrown_admin.%I TO emcrown_runtime', tab);
    END IF;
  END LOOP;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'emcrown_runtime') THEN
    REVOKE UPDATE ON emcrown_admin.appointment_events, emcrown_admin.physician_documents FROM emcrown_runtime;
    GRANT DELETE ON emcrown_admin.appointment_tokens, emcrown_admin.sms_suppressions TO emcrown_runtime;
  END IF;
END $$;
