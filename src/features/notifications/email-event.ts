// Server-only boundary: retain only final SES outcome and correlate a single opaque message ID.
import "server-only";
import { z } from "zod";
const affectedSchema = z.object({ timestamp: z.iso.datetime({ offset: true }),
  recipients: z.array(z.email()).max(100).optional(),
  bouncedRecipients: z.array(z.object({ emailAddress: z.email() })).max(100).optional(),
  complainedRecipients: z.array(z.object({ emailAddress: z.email() })).max(100).optional(),
});
const eventSchema = z.object({
  notificationType: z.string().optional(), eventType: z.string().optional(),
  mail: z.object({ source: z.email(), sendingAccountId: z.string().regex(/^\d{12}$/),
    headers: z.array(z.object({ name: z.string().max(200), value: z.string().max(12000) })).max(200).optional() }),
  delivery: affectedSchema.optional(), bounce: affectedSchema.optional(), complaint: affectedSchema.optional(),
});
export function emailOutcome(input: unknown, sender: string, account: string) {
  const event = eventSchema.parse(input);
  if (event.mail.source.toLowerCase() !== sender.toLowerCase() || event.mail.sendingAccountId !== account) return null;
  const type = event.notificationType ?? event.eventType;
  const status = type === "Delivery" ? "delivered" : type === "Bounce" ? "bounced" : type === "Complaint" ? "complained" : null;
  if (!status) return null;
  const data = status === "delivered" ? event.delivery : status === "bounced" ? event.bounce : event.complaint;
  if (!data) return null;
  const headers = event.mail.headers?.filter(header => header.name.toLowerCase() === "x-emcrown-notification-id") ?? [];
  if (headers.length !== 1) return null;
  const id = z.uuid().safeParse(headers[0].value.trim()); if (!id.success) return null;
  const recipients = data.recipients ?? data.bouncedRecipients?.map(item => item.emailAddress) ?? data.complainedRecipients?.map(item => item.emailAddress) ?? [];
  return { messageId: id.data, status, at: new Date(data.timestamp), recipients };
}
export function deliveryRank(status: string) { return status === "delivered" ? 1 : status === "bounced" ? 2 : status === "complained" ? 3 : 0; }
