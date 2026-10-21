// Server database schema: operational metadata stays queryable; all personal payloads are ciphertext.
import { sql } from "drizzle-orm";
import { pgSchema, uuid, text, timestamp, boolean, integer, jsonb, primaryKey, unique, foreignKey, check, index } from "drizzle-orm/pg-core";
import { organisations, users } from "@/lib/db/schema";
import type { ProviderSchedule } from "@/types/clinical";
const clinical = pgSchema("emcrown_admin");
const time = (name: string) => timestamp(name, { withTimezone: true });
export const physicians = clinical.table("physicians", {
  id: uuid().primaryKey().defaultRandom(), organisationId: uuid("organisation_id").notNull().references(() => organisations.id),
  profile: text().notNull(), publication: text(), slugHash: text("slug").notNull(), active: boolean().notNull().default(true),
  version: integer().notNull().default(1), updatedAt: time("updated_at").notNull().defaultNow(),
}, t => [unique("physician_tenant_id").on(t.organisationId, t.id), unique("physician_slug").on(t.organisationId, t.slugHash),
  check("physician_version", sql`${t.version} > 0`)]);
export const physicianDocuments = clinical.table("physician_documents", {
  id: uuid().primaryKey().defaultRandom(), organisationId: uuid("organisation_id").notNull(), physicianId: uuid("physician_id").notNull(),
  objectPath: text("object_path").notNull(), metadata: text().notNull(), createdAt: time("created_at").notNull().defaultNow(),
}, t => [foreignKey({ columns: [t.organisationId, t.physicianId], foreignColumns: [physicians.organisationId, physicians.id] })]);
export const providerSchedules = clinical.table("provider_schedules", {
  id: uuid().primaryKey().defaultRandom(), organisationId: uuid("organisation_id").notNull(), physicianId: uuid("physician_id").notNull(),
  definition: jsonb().$type<ProviderSchedule>().notNull(), version: integer().notNull().default(1), updatedAt: time("updated_at").notNull().defaultNow(),
}, t => [foreignKey({ columns: [t.organisationId, t.physicianId], foreignColumns: [physicians.organisationId, physicians.id] }),
  unique("schedule_scope").on(t.organisationId, t.physicianId, t.id)]);
export const appointments = clinical.table("appointments", {
  id: uuid().primaryKey().defaultRandom(), organisationId: uuid("organisation_id").notNull(), physicianId: uuid("physician_id").notNull(),
  locationId: text("location_id").notNull(), typeId: text("type_id").notNull(), startAt: time("start_at").notNull(), endAt: time("end_at").notNull(),
  occupiedUntil: time("occupied_until").notNull(), status: text().notNull().default("requested"),
  patient: text().notNull(), idempotencyKey: uuid("idempotency_key").notNull(), version: integer().notNull().default(1),
  createdAt: time("created_at").notNull().defaultNow(), updatedAt: time("updated_at").notNull().defaultNow(),
}, t => [foreignKey({ columns: [t.organisationId, t.physicianId], foreignColumns: [physicians.organisationId, physicians.id] }),
  unique("booking_idempotency").on(t.organisationId, t.idempotencyKey), unique("appointment_tenant_id").on(t.organisationId, t.id),
  check("appointment_status", sql`${t.status} in ('requested', 'confirmed', 'cancelled', 'completed', 'no_show')`),
  check("appointment_time", sql`${t.startAt} < ${t.endAt} and ${t.endAt} <= ${t.occupiedUntil}`),
  check("appointment_version", sql`${t.version} > 0`), index("appointment_date").on(t.organisationId, t.startAt)]);
export const appointmentEvents = clinical.table("appointment_events", {
  id: uuid().primaryKey().defaultRandom(), organisationId: uuid("organisation_id").notNull().references(() => organisations.id),
  appointmentId: uuid("appointment_id"), actorId: uuid("actor_id").references(() => users.id),
  action: text().notNull(), createdAt: time("created_at").notNull().defaultNow(),
}, t => [index("clinical_event_time").on(t.organisationId, t.createdAt)]);
export const appointmentMessages = clinical.table("appointment_messages", {
  id: uuid().primaryKey().defaultRandom(), organisationId: uuid("organisation_id").notNull(), appointmentId: uuid("appointment_id").notNull(),
  appointmentVersion: integer("appointment_version").notNull(), channel: text().notNull(), kind: text().notNull(), payload: text().notNull(),
  availableAt: time("available_at").notNull(), state: text().notNull().default("queued"), attempts: integer().notNull().default(0),
  providerId: text("provider_id"), updatedAt: time("updated_at").notNull().defaultNow(),
}, t => [foreignKey({ columns: [t.organisationId, t.appointmentId], foreignColumns: [appointments.organisationId, appointments.id] }),
  unique("appointment_message_once").on(t.appointmentId, t.appointmentVersion, t.channel, t.kind),
  check("appointment_message_state", sql`${t.state} in ('queued', 'sending', 'sent', 'failed', 'cancelled')`)]);
export const appointmentTokens = clinical.table("appointment_tokens", {
  tokenHash: text("token_hash").primaryKey(), organisationId: uuid("organisation_id").notNull(), appointmentId: uuid("appointment_id").notNull(),
  expiresAt: time("expires_at").notNull(), version: integer().notNull(),
}, t => [foreignKey({ columns: [t.organisationId, t.appointmentId], foreignColumns: [appointments.organisationId, appointments.id] })]);
export const smsSuppressions = clinical.table("sms_suppressions", {
  organisationId: uuid("organisation_id").notNull().references(() => organisations.id), phoneHash: text("phone_hash").notNull(),
  createdAt: time("created_at").notNull().defaultNow(),
}, t => [primaryKey({ columns: [t.organisationId, t.phoneHash] })]);
