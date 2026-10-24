// Server-only atomic final outcome: deduplicate callbacks and never downgrade complaints/bounces.
import "server-only";
import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { appointmentMessages, notificationDelivery } from "@/lib/db/clinical";
import { unseal } from "@/features/clinical/encryption";
import { messagePayloadSchema } from "@/features/appointments/delivery";
import { clinicalEvent } from "@/features/clinical/access";
import { deliveryRank, type emailOutcome } from "@/features/notifications/email-event";
export async function recordDelivery(outcome: NonNullable<ReturnType<typeof emailOutcome>>) {
  return db().transaction(async tx => {
    const [message] = await tx.select().from(appointmentMessages).where(eq(appointmentMessages.id, outcome.messageId));
    if (!message || !["email", "staff", "physician"].includes(message.channel)) return;
    const payload = messagePayloadSchema.parse(JSON.parse(unseal(message.payload, message.organisationId, message.id, "message")));
    if (!outcome.recipients.some(recipient => recipient.toLowerCase() === payload.to.toLowerCase())) return;
    const changed = await tx.insert(notificationDelivery).values({ messageId: message.id, status: outcome.status, occurredAt: outcome.at })
      .onConflictDoUpdate({ target: notificationDelivery.messageId, set: { status: outcome.status, occurredAt: outcome.at },
        setWhere: sql`case ${notificationDelivery.status} when 'delivered' then 1 when 'bounced' then 2 else 3 end < ${deliveryRank(outcome.status)}` })
      .returning({ id: notificationDelivery.messageId });
    if (changed.length) await clinicalEvent(tx, message.organisationId, `notifications.email_${outcome.status}`, undefined, message.appointmentId);
  });
}
