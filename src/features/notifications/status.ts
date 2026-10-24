// Shared status formatting: never infer final delivery from an SMTP acceptance.
import type { NotificationMessage } from "@/features/notifications/contracts";
import { NOTIFICATION_COPY as copy } from "@/config/notifications";
export function notificationState(message: NotificationMessage) {
  return message.deliveryStatus ?? message.state;
}
export function notificationStateLabel(message: NotificationMessage) {
  const state = notificationState(message);
  return copy.states[state as keyof typeof copy.states] ?? copy.unknown;
}
export function notificationAudience(channel: string) {
  return channel === "email" ? copy.patient : channel === "physician" ? copy.physician : channel === "staff" ? copy.staff : channel === "sms" ? copy.sms : copy.unknown;
}
export function notificationKind(kind: string) { return copy.kinds[kind as keyof typeof copy.kinds] ?? copy.unknown; }
export function notificationNeedsAttention(message: NotificationMessage) {
  return ["failed", "bounced", "complained"].includes(notificationState(message));
}
