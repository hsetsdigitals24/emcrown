CREATE SCHEMA IF NOT EXISTS "emcrown_admin";
--> statement-breakpoint
CREATE TYPE "emcrown_admin"."audit_action" AS ENUM('organisation.seeded', 'auth.login', 'auth.logout', 'auth.password_changed', 'auth.reset_requested', 'auth.reset_completed', 'auth.reset_email', 'auth.mfa_enrolled', 'auth.mfa_verified', 'auth.rate_limited', 'portal.viewed', 'audit.viewed', 'access.denied');--> statement-breakpoint
CREATE TYPE "emcrown_admin"."role" AS ENUM('super_admin', 'admin', 'staff');--> statement-breakpoint
CREATE TYPE "emcrown_admin"."session_stage" AS ENUM('password', 'enroll', 'mfa', 'full');--> statement-breakpoint
CREATE TABLE "emcrown_admin"."audit_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organisation_id" uuid,
	"actor_id" uuid,
	"actor_role" "emcrown_admin"."role",
	"action" "emcrown_admin"."audit_action" NOT NULL,
	"outcome" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "audit_outcome" CHECK ("emcrown_admin"."audit_events"."outcome" in ('success', 'failure', 'denied'))
);
--> statement-breakpoint
CREATE TABLE "emcrown_admin"."mail_outbox" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"payload" text NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"available_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "one_reset_mail_per_user" UNIQUE("user_id"),
	CONSTRAINT "mail_attempts" CHECK ("emcrown_admin"."mail_outbox"."attempts" between 0 and 5)
);
--> statement-breakpoint
CREATE TABLE "emcrown_admin"."memberships" (
	"organisation_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "emcrown_admin"."role" NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "memberships_organisation_id_user_id_pk" PRIMARY KEY("organisation_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "emcrown_admin"."organisations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"key" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organisations_key_unique" UNIQUE("key"),
	CONSTRAINT "organisation_name_length" CHECK (length("emcrown_admin"."organisations"."name") between 1 and 120)
);
--> statement-breakpoint
CREATE TABLE "emcrown_admin"."rate_limits" (
	"key" text PRIMARY KEY NOT NULL,
	"attempts" integer NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	CONSTRAINT "positive_attempts" CHECK ("emcrown_admin"."rate_limits"."attempts" > 0)
);
--> statement-breakpoint
CREATE TABLE "emcrown_admin"."reset_tokens" (
	"token_hash" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reset_hash_format" CHECK ("emcrown_admin"."reset_tokens"."token_hash" ~ '^[a-f0-9]{64}$'),
	CONSTRAINT "reset_expiry" CHECK ("emcrown_admin"."reset_tokens"."expires_at" > "emcrown_admin"."reset_tokens"."created_at")
);
--> statement-breakpoint
CREATE TABLE "emcrown_admin"."sessions" (
	"token_hash" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"organisation_id" uuid NOT NULL,
	"stage" "emcrown_admin"."session_stage" NOT NULL,
	"enrollment_secret" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "session_hash_format" CHECK ("emcrown_admin"."sessions"."token_hash" ~ '^[a-f0-9]{64}$'),
	CONSTRAINT "session_expiry" CHECK ("emcrown_admin"."sessions"."expires_at" > "emcrown_admin"."sessions"."created_at")
);
--> statement-breakpoint
CREATE TABLE "emcrown_admin"."users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"must_change_password" boolean DEFAULT true NOT NULL,
	"mfa_secret" text,
	"last_mfa_step" bigint DEFAULT -1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "email_normalised" CHECK ("emcrown_admin"."users"."email" = lower(trim("emcrown_admin"."users"."email")) and length("emcrown_admin"."users"."email") <= 254 and "emcrown_admin"."users"."email" ~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'),
	CONSTRAINT "password_hash_format" CHECK ("emcrown_admin"."users"."password_hash" ~ '^scrypt:[a-f0-9]{32}:[a-f0-9]{128}$')
);
--> statement-breakpoint
ALTER TABLE "emcrown_admin"."audit_events" ADD CONSTRAINT "audit_events_organisation_id_organisations_id_fk" FOREIGN KEY ("organisation_id") REFERENCES "emcrown_admin"."organisations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "emcrown_admin"."audit_events" ADD CONSTRAINT "audit_events_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "emcrown_admin"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "emcrown_admin"."mail_outbox" ADD CONSTRAINT "mail_outbox_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "emcrown_admin"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "emcrown_admin"."memberships" ADD CONSTRAINT "memberships_organisation_id_organisations_id_fk" FOREIGN KEY ("organisation_id") REFERENCES "emcrown_admin"."organisations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "emcrown_admin"."memberships" ADD CONSTRAINT "memberships_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "emcrown_admin"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "emcrown_admin"."reset_tokens" ADD CONSTRAINT "reset_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "emcrown_admin"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_organisation_time" ON "emcrown_admin"."audit_events" USING btree ("organisation_id","created_at");--> statement-breakpoint
CREATE INDEX "reset_user" ON "emcrown_admin"."reset_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_user" ON "emcrown_admin"."sessions" USING btree ("user_id");