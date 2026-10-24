// Shared validated notification projections: never include recipients, payloads or manage tokens.
import { z } from "zod";
export const deliveryStatusSchema = z.enum(["delivered", "bounced", "complained"]);
export const notificationMessageSchema = z.object({
  appointmentId: z.uuid(), channel: z.string(), kind: z.string(), state: z.string(),
  id: z.uuid().optional(), availableAt: z.iso.datetime().optional(), updatedAt: z.iso.datetime().optional(), attempts: z.number().int().nonnegative().optional(),
  deliveryStatus: deliveryStatusSchema.nullable().optional(), deliveryAt: z.iso.datetime().nullable().optional(),
});
export type NotificationMessage = z.infer<typeof notificationMessageSchema>;
export const notificationFeedSchema = z.object({
  events: z.array(z.object({ id: z.uuid(), action: z.string(), at: z.iso.datetime() })),
  attention: z.array(z.object({ id: z.uuid(), channel: z.string(), kind: z.string(), state: z.string(), at: z.iso.datetime() })),
  page: z.number().int().nonnegative(), hasMore: z.boolean(),
});
export type NotificationFeedData = z.infer<typeof notificationFeedSchema>;
export const notificationFeedQuery = z.object({ page: z.coerce.number().int().min(0).max(10000).default(0) }).strict();
