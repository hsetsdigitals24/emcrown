CREATE TABLE "emcrown_admin"."cms_documents" (
	"organisation_id" uuid NOT NULL,
	"path" text NOT NULL,
	"draft" jsonb NOT NULL,
	"published" jsonb,
	"withdrawn" boolean DEFAULT false NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cms_documents_organisation_id_path_pk" PRIMARY KEY("organisation_id","path"),
	CONSTRAINT "cms_version_positive" CHECK ("emcrown_admin"."cms_documents"."version" > 0)
);
--> statement-breakpoint
CREATE TABLE "emcrown_admin"."cms_media" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organisation_id" uuid NOT NULL,
	"content_type" text NOT NULL,
	"data" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cms_media_type" CHECK ("emcrown_admin"."cms_media"."content_type" in ('image/jpeg', 'image/png', 'image/webp')),
	CONSTRAINT "cms_media_size" CHECK (length("emcrown_admin"."cms_media"."data") <= 4194304)
);
--> statement-breakpoint
CREATE TABLE "emcrown_admin"."cms_revisions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organisation_id" uuid NOT NULL,
	"path" text NOT NULL,
	"values" jsonb NOT NULL,
	"action" text NOT NULL,
	"actor_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cms_revision_action" CHECK ("emcrown_admin"."cms_revisions"."action" in ('initial', 'save', 'publish', 'unpublish', 'restore'))
);
--> statement-breakpoint
ALTER TABLE "emcrown_admin"."cms_documents" ADD CONSTRAINT "cms_documents_organisation_id_organisations_id_fk" FOREIGN KEY ("organisation_id") REFERENCES "emcrown_admin"."organisations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "emcrown_admin"."cms_media" ADD CONSTRAINT "cms_media_organisation_id_organisations_id_fk" FOREIGN KEY ("organisation_id") REFERENCES "emcrown_admin"."organisations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "emcrown_admin"."cms_revisions" ADD CONSTRAINT "cms_revisions_organisation_id_organisations_id_fk" FOREIGN KEY ("organisation_id") REFERENCES "emcrown_admin"."organisations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "emcrown_admin"."cms_revisions" ADD CONSTRAINT "cms_revisions_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "emcrown_admin"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "cms_revision_page" ON "emcrown_admin"."cms_revisions" USING btree ("organisation_id","path","created_at");
--> statement-breakpoint
CREATE TRIGGER cms_revisions_immutable
BEFORE UPDATE OR DELETE OR TRUNCATE ON emcrown_admin.cms_revisions
FOR EACH STATEMENT EXECUTE FUNCTION emcrown_admin.reject_audit_mutation();
--> statement-breakpoint
REVOKE ALL ON emcrown_admin.cms_documents, emcrown_admin.cms_revisions, emcrown_admin.cms_media FROM PUBLIC;
--> statement-breakpoint
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON emcrown_admin.cms_documents, emcrown_admin.cms_revisions, emcrown_admin.cms_media FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON emcrown_admin.cms_documents, emcrown_admin.cms_revisions, emcrown_admin.cms_media FROM authenticated;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'emcrown_runtime') THEN
    GRANT SELECT, INSERT, UPDATE ON emcrown_admin.cms_documents TO emcrown_runtime;
    GRANT SELECT, INSERT ON emcrown_admin.cms_revisions, emcrown_admin.cms_media TO emcrown_runtime;
    REVOKE UPDATE, DELETE, TRUNCATE ON emcrown_admin.cms_revisions FROM emcrown_runtime;
  END IF;
END $$;
