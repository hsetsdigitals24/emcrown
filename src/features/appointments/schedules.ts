// Server-only schedule administration: tenant scope, optimistic versions and provider locks.
import "server-only";
import { z } from "zod";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { physicians, providerSchedules } from "@/lib/db/clinical";
import { clinicalActor, clinicalEvent } from "@/features/clinical/access";
import { scheduleSchema } from "@/features/clinical/validation";
export const scheduleWriteSchema = z.object({ id: z.uuid().optional(), version: z.number().int().nonnegative(), definition: scheduleSchema }).strict();
export async function listSchedules() {
  return db().transaction(async tx => {
    const actor = await clinicalActor(tx, "appointments:read"); if (!actor) return { ok: false as const, code: "denied" as const };
    const rows = await tx.select().from(providerSchedules).where(eq(providerSchedules.organisationId, actor.organisationId));
    return { ok: true as const, data: rows.map(row => ({ id: row.id, version: row.version, definition: scheduleSchema.parse(row.definition) })) };
  });
}
export async function writeSchedule(input: unknown) {
  const parsed = scheduleWriteSchema.safeParse(input); if (!parsed.success) return { ok: false as const, code: "invalid" as const };
  return db().transaction(async tx => {
    const actor = await clinicalActor(tx, "physicians:manage"); if (!actor) return { ok: false as const, code: "denied" as const };
    const { id, version, definition } = parsed.data;
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${actor.organisationId}), hashtext(${definition.physicianId}))`);
    const [provider] = await tx.select({ id: physicians.id }).from(physicians).where(and(eq(physicians.id, definition.physicianId), eq(physicians.organisationId, actor.organisationId)));
    if (!provider) return { ok: false as const, code: "invalid" as const };
    const [existing] = id ? await tx.select().from(providerSchedules).where(and(eq(providerSchedules.id, id), eq(providerSchedules.organisationId, actor.organisationId))).for("update") : [];
    if ((existing?.version ?? 0) !== version || (id && (!existing || existing.physicianId !== definition.physicianId))) return { ok: false as const, code: "conflict" as const };
    if (existing) await tx.update(providerSchedules).set({ definition, version: version + 1, updatedAt: new Date() }).where(eq(providerSchedules.id, existing.id));
    else await tx.insert(providerSchedules).values({ organisationId: actor.organisationId, physicianId: definition.physicianId, definition });
    await clinicalEvent(tx, actor.organisationId, "schedules.saved", actor.userId);
    return { ok: true as const, data: null };
  });
}
