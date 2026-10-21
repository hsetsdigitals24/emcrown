// Server database contracts: private organisation-scoped authentication storage.
import { sql } from "drizzle-orm";
import { pgSchema, uuid, text, timestamp, boolean, integer, bigint, primaryKey, unique, check, index, foreignKey, jsonb } from "drizzle-orm/pg-core";
import type { CmsValues } from "@/types/cms";
import { ADMIN_ROLES, AUDIT_ACTIONS } from "@/types/auth";
export const admin = pgSchema("emcrown_admin");
export const roleEnum = admin.enum("role", ADMIN_ROLES);
export const stageEnum = admin.enum("session_stage", ["password", "enroll", "mfa", "full"]);
export const actionEnum = admin.enum("audit_action", AUDIT_ACTIONS);
const time = (name: string) => timestamp(name, { withTimezone: true });
export const organisations = admin.table("organisations", {
  id: uuid().primaryKey().defaultRandom(), name: text().notNull(), key: text().notNull().unique(),
  createdAt: time("created_at").notNull().defaultNow(),
}, t => [check("organisation_name_length", sql`length(${t.name}) between 1 and 120`)]);
export const users = admin.table("users", {
  id: uuid().primaryKey().defaultRandom(), email: text().notNull().unique(),
  passwordHash: text("password_hash").notNull(), active: boolean().notNull().default(true),
  mustChangePassword: boolean("must_change_password").notNull().default(true),
  mfaSecret: text("mfa_secret"), lastMfaStep: bigint("last_mfa_step", { mode: "number" }).notNull().default(-1),
  createdAt: time("created_at").notNull().defaultNow(),
}, t => [
  check("email_normalised", sql`${t.email} = lower(trim(${t.email})) and length(${t.email}) <= 254 and ${t.email} ~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'`),
  check("password_hash_format", sql`${t.passwordHash} ~ '^scrypt:[a-f0-9]{32}:[a-f0-9]{128}$'`),
]);
export const memberships = admin.table("memberships", {
  organisationId: uuid("organisation_id").notNull().references(() => organisations.id),
  userId: uuid("user_id").notNull().references(() => users.id), role: roleEnum().notNull(),
  active: boolean().notNull().default(true),
}, t => [primaryKey({ columns: [t.organisationId, t.userId] })]);
export const sessions = admin.table("sessions", {
  tokenHash: text("token_hash").primaryKey(), userId: uuid("user_id").notNull(),
  organisationId: uuid("organisation_id").notNull(), stage: stageEnum().notNull(),
  enrollmentSecret: text("enrollment_secret"), createdAt: time("created_at").notNull().defaultNow(),
  expiresAt: time("expires_at").notNull(), lastSeenAt: time("last_seen_at").notNull().defaultNow(),
}, t => [
  foreignKey({ columns: [t.organisationId, t.userId], foreignColumns: [memberships.organisationId, memberships.userId], name: "session_membership" }),
  check("session_hash_format", sql`${t.tokenHash} ~ '^[a-f0-9]{64}$'`),
  check("session_expiry", sql`${t.expiresAt} > ${t.createdAt}`),
  index("session_user").on(t.userId),
]);
export const resetTokens = admin.table("reset_tokens", {
  tokenHash: text("token_hash").primaryKey(), userId: uuid("user_id").notNull().references(() => users.id),
  expiresAt: time("expires_at").notNull(), createdAt: time("created_at").notNull().defaultNow(),
}, t => [check("reset_hash_format", sql`${t.tokenHash} ~ '^[a-f0-9]{64}$'`),
  check("reset_expiry", sql`${t.expiresAt} > ${t.createdAt}`), index("reset_user").on(t.userId)]);
export const auditEvents = admin.table("audit_events", {
  id: uuid().primaryKey().defaultRandom(), organisationId: uuid("organisation_id").references(() => organisations.id),
  actorId: uuid("actor_id").references(() => users.id), actorRole: roleEnum("actor_role"),
  action: actionEnum().notNull(), outcome: text().notNull(),
  createdAt: time("created_at").notNull().defaultNow(),
}, t => [check("audit_outcome", sql`${t.outcome} in ('success', 'failure', 'denied')`),
  index("audit_organisation_time").on(t.organisationId, t.createdAt)]);
export const rateLimits = admin.table("rate_limits", {
  key: text().primaryKey(), attempts: integer().notNull(), expiresAt: time("expires_at").notNull(),
}, t => [check("positive_attempts", sql`${t.attempts} > 0`)]);
export const mailOutbox = admin.table("mail_outbox", {
  id: uuid().primaryKey().defaultRandom(), userId: uuid("user_id").notNull().references(() => users.id),
  payload: text().notNull(), kind: text().notNull().default("reset"), attempts: integer().notNull().default(0),
  expiresAt: time("expires_at").notNull(), availableAt: time("available_at").notNull().defaultNow(),
}, t => [unique("one_reset_mail_per_user").on(t.userId), check("mail_attempts", sql`${t.attempts} between 0 and 5`)]);

// Ownership is distinct from role: the one-time latch cannot be reset by runtime writes.
export const ownership = admin.table("ownership", {
  organisationId: uuid("organisation_id").primaryKey().references(() => organisations.id),
  ownerId: uuid("owner_id").notNull().references(() => users.id),
  transferredAt: time("transferred_at"),
});
export const invitations = admin.table("invitations", {
  tokenHash: text("token_hash").primaryKey(), organisationId: uuid("organisation_id").notNull().references(() => organisations.id),
  userId: uuid("user_id").notNull().unique().references(() => users.id),
  expiresAt: time("expires_at").notNull(),
});
export const recoveryCodes = admin.table("recovery_codes", {
  tokenHash: text("token_hash").primaryKey(), userId: uuid("user_id").notNull().references(() => users.id),
  createdAt: time("created_at").notNull().defaultNow(),
});

// Draft and published snapshots are separate; version checks protect concurrent editors.
export const cmsDocuments = admin.table("cms_documents", {
  organisationId: uuid("organisation_id").notNull().references(() => organisations.id),
  path: text().notNull(), draft: jsonb().$type<CmsValues>().notNull(),
  published: jsonb().$type<CmsValues>(), withdrawn: boolean().notNull().default(false), version: integer().notNull().default(1),
  updatedAt: time("updated_at").notNull().defaultNow(),
}, t => [primaryKey({ columns: [t.organisationId, t.path] }), check("cms_version_positive", sql`${t.version} > 0`)]);
export const cmsRevisions = admin.table("cms_revisions", {
  id: uuid().primaryKey().defaultRandom(), organisationId: uuid("organisation_id").notNull().references(() => organisations.id),
  path: text().notNull(), values: jsonb().$type<CmsValues>().notNull(),
  action: text().notNull(), actorId: uuid("actor_id").notNull().references(() => users.id),
  createdAt: time("created_at").notNull().defaultNow(),
}, t => [check("cms_revision_action", sql`${t.action} in ('initial', 'save', 'publish', 'unpublish', 'restore')`), index("cms_revision_page").on(t.organisationId, t.path, t.createdAt)]);
export const cmsMedia = admin.table("cms_media", {
  id: uuid().primaryKey().defaultRandom(), organisationId: uuid("organisation_id").notNull().references(() => organisations.id),
  contentType: text("content_type").notNull(), data: text().notNull(),
  storagePath: text("storage_path"),
  createdAt: time("created_at").notNull().defaultNow(),
}, t => [check("cms_media_type", sql`${t.contentType} in ('image/jpeg', 'image/png', 'image/webp')`),
  check("cms_media_size", sql`length(${t.data}) <= 4194304`)]);
