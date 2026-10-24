// Server-only message projections: optional delivery join never reads encrypted payloads.
import "server-only";
import { inArray } from "drizzle-orm";
import type { AuthTransaction } from "@/lib/db";
import { notificationDelivery } from "@/lib/db/clinical";
import { emailEventsConfigured } from "@/features/notifications/env";
import { deliveryStatusSchema, type NotificationMessage } from "@/features/notifications/contracts";
type QueueProjection = { id: string; appointmentId: string; channel: string; kind: string; state: string; availableAt: Date; updatedAt: Date; attempts: number };
export async function messageDelivery(tx: AuthTransaction, messages: QueueProjection[]): Promise<NotificationMessage[]> {
  const delivery = emailEventsConfigured() && messages.length ? await tx.select().from(notificationDelivery)
    .where(inArray(notificationDelivery.messageId, messages.map(message => message.id))) : [];
  return messages.map(message => {
    const outcome = delivery.find(item => item.messageId === message.id);
    return { ...message, availableAt: message.availableAt.toISOString(), updatedAt: message.updatedAt.toISOString(),
      deliveryStatus: outcome ? deliveryStatusSchema.parse(outcome.status) : null, deliveryAt: outcome?.occurredAt.toISOString() ?? null };
  });
}
