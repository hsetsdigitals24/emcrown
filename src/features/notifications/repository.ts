// Server-only notification feed: tenant-scoped operational alerts without patient/contact details.
import "server-only";
import { and, desc, eq, inArray, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { appointmentEvents, appointmentMessages, notificationDelivery } from "@/lib/db/clinical";
import { clinicalActor, clinicalEvent } from "@/features/clinical/access";
import { NOTIFICATION_EVENTS } from "@/config/notifications";
import { notificationFeedQuery, type NotificationFeedData } from "@/features/notifications/contracts";
import { emailEventsConfigured } from "@/features/notifications/env";
import type { ClinicalResult } from "@/types/clinical";
export async function listNotificationFeed(input: unknown): Promise<ClinicalResult<NotificationFeedData>> {
  const parsed = notificationFeedQuery.safeParse(input);
  if (!parsed.success) return { ok: false, code: "invalid" };
  return db().transaction(async tx => {
    const actor = await clinicalActor(tx, "appointments:read");
    if (!actor) return { ok: false, code: "denied" };
    const events = await tx.select({ id: appointmentEvents.id, action: appointmentEvents.action, at: appointmentEvents.createdAt }).from(appointmentEvents)
      .where(and(eq(appointmentEvents.organisationId, actor.organisationId), inArray(appointmentEvents.action, Object.keys(NOTIFICATION_EVENTS))))
      .orderBy(desc(appointmentEvents.createdAt), desc(appointmentEvents.id)).limit(26).offset(parsed.data.page * 25);
    const fields = { id: appointmentMessages.id, channel: appointmentMessages.channel, kind: appointmentMessages.kind, state: appointmentMessages.state, at: appointmentMessages.updatedAt };
    const attention = emailEventsConfigured()
      ? await tx.select({ ...fields, delivery: notificationDelivery.status }).from(appointmentMessages).leftJoin(notificationDelivery, eq(notificationDelivery.messageId, appointmentMessages.id))
        .where(and(eq(appointmentMessages.organisationId, actor.organisationId), or(eq(appointmentMessages.state, "failed"), inArray(notificationDelivery.status, ["bounced", "complained"]))))
        .orderBy(desc(appointmentMessages.updatedAt), desc(appointmentMessages.id)).limit(20)
      : await tx.select({ ...fields }).from(appointmentMessages).where(and(eq(appointmentMessages.organisationId, actor.organisationId), eq(appointmentMessages.state, "failed")))
        .orderBy(desc(appointmentMessages.updatedAt), desc(appointmentMessages.id)).limit(20);
    await clinicalEvent(tx, actor.organisationId, "notifications.viewed", actor.userId);
    return { ok: true, data: { events: events.slice(0, 25).map(event => ({ ...event, at: event.at.toISOString() })),
      attention: attention.map(item => ({ id: item.id, channel: item.channel, kind: item.kind,
        state: "delivery" in item && typeof item.delivery === "string" ? item.delivery : item.state, at: item.at.toISOString() })),
      page: parsed.data.page, hasMore: events.length > 25 } };
  });
}
