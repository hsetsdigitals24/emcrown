// Server-only history query: filters and totals share the authenticated organisation scope.
import "server-only";
import { and, asc, desc, eq, gte, inArray, isNotNull, isNull, lt, notInArray, sql } from "drizzle-orm";
import type { AuthTransaction } from "@/lib/db";
import { auditEvents, users } from "@/lib/db/schema";
import { AUDIT_ACTIONS } from "@/types/auth";
import { ACTIVITY_POLICY } from "@/config/activity";
import { activityCategory, activityFilterSchema, activityRange } from "@/features/activity/filters";
export async function readActivity(tx: AuthTransaction, organisationId: string, userId: string, input: unknown = {}) {
  const parsed = activityFilterSchema.safeParse(input);
  const defaults = activityFilterSchema.parse({});
  const empty = { filters: defaults, events: [], actors: [], total: 0, success: 0, failure: 0, denied: 0, pageCount: 1, invalid: true };
  if (!parsed.success) return empty;
  const filters = parsed.data;
  const snapshot = new Date(filters.snapshot ?? Date.now());
  const range = activityRange(filters, snapshot);
  const conditions = and(eq(auditEvents.organisationId, organisationId), lt(auditEvents.createdAt, range.end),
    range.start ? gte(auditEvents.createdAt, range.start) : undefined,
    filters.category !== "all" ? inArray(auditEvents.action, AUDIT_ACTIONS.filter(action => activityCategory(action) === filters.category)) : undefined,
    filters.action ? eq(auditEvents.action, filters.action) : undefined,
    filters.outcome === "attention" ? inArray(auditEvents.outcome, ["failure", "denied"]) : filters.outcome !== "all" ? eq(auditEvents.outcome, filters.outcome) : undefined,
    filters.role === "unknown" ? isNull(auditEvents.actorRole) : filters.role !== "all" ? eq(auditEvents.actorRole, filters.role) : undefined,
    filters.actor === "unknown" ? isNull(auditEvents.actorId) : filters.actor !== "all" ? eq(auditEvents.actorId, filters.actor === "mine" ? userId : filters.actor) : filters.actorId ? eq(auditEvents.actorId, filters.actorId) : undefined,
    filters.hideRoutine ? notInArray(auditEvents.action, [...ACTIVITY_POLICY.routineActions]) : undefined);
  const [counts] = await tx.select({ total: sql<number>`count(*)`.mapWith(Number),
    success: sql<number>`count(*) filter (where ${auditEvents.outcome} = 'success')`.mapWith(Number),
    failure: sql<number>`count(*) filter (where ${auditEvents.outcome} = 'failure')`.mapWith(Number),
    denied: sql<number>`count(*) filter (where ${auditEvents.outcome} = 'denied')`.mapWith(Number),
  }).from(auditEvents).where(conditions);
  const pageCount = Math.max(1, Math.ceil(counts.total / ACTIVITY_POLICY.pageSize));
  const page = Math.min(filters.page, pageCount);
  const events = await tx.select().from(auditEvents).where(conditions)
    .orderBy(desc(auditEvents.createdAt), desc(auditEvents.id)).limit(ACTIVITY_POLICY.pageSize).offset((page - 1) * ACTIVITY_POLICY.pageSize);
  // Only actors already recorded in this organisation are offered; never list the global account directory.
  const actors = await tx.selectDistinct({ id: auditEvents.actorId, email: users.email }).from(auditEvents)
    .leftJoin(users, eq(users.id, auditEvents.actorId)).where(and(eq(auditEvents.organisationId, organisationId), isNotNull(auditEvents.actorId)))
    .orderBy(asc(users.email), asc(auditEvents.actorId));
  return { filters: { ...filters, snapshot: snapshot.toISOString(), page }, events, actors, ...counts, pageCount, invalid: false };
}
export type ActivityData = Awaited<ReturnType<typeof readActivity>>;
