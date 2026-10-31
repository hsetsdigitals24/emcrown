// Shared pure boundary validation: bounded filters and stable UTC history snapshots.
import { z } from "zod";
import { AUDIT_ACTIONS } from "@/types/auth";
import { ACTIVITY_POLICY } from "@/config/activity";
const DAY_MS = 86400000;
const optional = <T extends z.ZodType>(schema: T) => z.preprocess(value => value === "" ? undefined : value, schema.optional());
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => {
  const parsed = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
});
export const activityFilterSchema = z.object({
  period: z.enum(["all", "today", "day", "week", "month", "custom"]).default("all"),
  from: optional(date), to: optional(date),
  category: z.enum(["all", "auth", "access", "members", "ownership", "organisation"]).default("all"),
  action: optional(z.enum(AUDIT_ACTIONS)),
  outcome: z.enum(["all", "attention", "success", "failure", "denied"]).default("all"),
  role: z.enum(["all", "super_admin", "admin", "staff", "unknown"]).default("all"),
  actor: z.union([z.enum(["all", "mine", "unknown"]), z.uuid()]).default("all"), actorId: optional(z.uuid()),
  hideRoutine: optional(z.literal("1")),
  page: z.union([z.string().regex(/^[1-9]\d{0,5}$/), z.number()]).transform(value => Number(value)).pipe(z.number().int().min(1).max(ACTIVITY_POLICY.maxPage)).default(1),
  snapshot: optional(z.iso.datetime().refine(value => Date.parse(value) <= Date.now() + 60000)),
}).strict().superRefine((value, context) => {
  if (value.period === "custom" && (!value.from || !value.to || value.from > value.to)) context.addIssue({ code: "custom", message: "Invalid date range", path: ["from"] });
  if (value.actorId && value.actor !== "all") context.addIssue({ code: "custom", message: "Conflicting actor filters", path: ["actorId"] });
});
export type ActivityFilters = z.infer<typeof activityFilterSchema>;
export function activityRange(filters: ActivityFilters, snapshot: Date) {
  if (filters.period === "custom") return { start: new Date(`${filters.from}T00:00:00Z`), end: new Date(Math.min(Date.parse(`${filters.to}T00:00:00Z`) + DAY_MS, snapshot.getTime())) };
  const days = filters.period === "day" ? 1 : filters.period === "week" ? 7 : 30;
  const start = filters.period === "all" ? undefined : filters.period === "today" ? new Date(`${snapshot.toISOString().slice(0, 10)}T00:00:00Z`) : new Date(snapshot.getTime() - days * DAY_MS);
  return { start, end: snapshot };
}
export function activityCategory(action: string) {
  const prefix = action.split(".")[0];
  return prefix === "portal" || prefix === "audit" || prefix === "access" ? "access" : prefix;
}
export function activityHref(filters: ActivityFilters, changes: Partial<ActivityFilters> = {}) {
  const values = { ...filters, ...changes };
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) if (value !== undefined && value !== "") params.set(key, String(value));
  return `/emcrown-admin/activity?${params.toString()}`;
}
