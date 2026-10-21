ALTER TYPE "emcrown_admin"."audit_action" ADD VALUE 'members.invited';--> statement-breakpoint
ALTER TYPE "emcrown_admin"."audit_action" ADD VALUE 'members.accepted';--> statement-breakpoint
ALTER TYPE "emcrown_admin"."audit_action" ADD VALUE 'ownership.transferred';--> statement-breakpoint
ALTER TYPE "emcrown_admin"."audit_action" ADD VALUE 'auth.recovery_generated';--> statement-breakpoint
ALTER TYPE "emcrown_admin"."audit_action" ADD VALUE 'auth.recovered';--> statement-breakpoint
ALTER TYPE "emcrown_admin"."audit_action" ADD VALUE 'auth.invitation_email';--> statement-breakpoint
CREATE TABLE "emcrown_admin"."invitations" (
	"token_hash" text PRIMARY KEY NOT NULL,
	"organisation_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	CONSTRAINT "invitations_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "emcrown_admin"."ownership" (
	"organisation_id" uuid PRIMARY KEY NOT NULL,
	"owner_id" uuid NOT NULL,
	"transferred_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "emcrown_admin"."recovery_codes" (
	"token_hash" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "emcrown_admin"."mail_outbox" ADD COLUMN "kind" text DEFAULT 'reset' NOT NULL;--> statement-breakpoint
ALTER TABLE "emcrown_admin"."invitations" ADD CONSTRAINT "invitations_organisation_id_organisations_id_fk" FOREIGN KEY ("organisation_id") REFERENCES "emcrown_admin"."organisations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "emcrown_admin"."invitations" ADD CONSTRAINT "invitations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "emcrown_admin"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "emcrown_admin"."ownership" ADD CONSTRAINT "ownership_organisation_id_organisations_id_fk" FOREIGN KEY ("organisation_id") REFERENCES "emcrown_admin"."organisations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "emcrown_admin"."ownership" ADD CONSTRAINT "ownership_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "emcrown_admin"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "emcrown_admin"."recovery_codes" ADD CONSTRAINT "recovery_codes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "emcrown_admin"."users"("id") ON DELETE no action ON UPDATE no action;