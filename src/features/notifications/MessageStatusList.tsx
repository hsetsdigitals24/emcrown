// Shared message status presentation: safe projections only, readable recipient and outcome labels.
import type { NotificationMessage } from "@/features/notifications/contracts";
import { notificationAudience, notificationKind, notificationState, notificationStateLabel } from "@/features/notifications/status";
import { NOTIFICATION_COPY as copy } from "@/config/notifications";
import { BOOKING_SETTINGS } from "@/config/booking";
function stamp(value?: string | null) {
  return value ? new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: BOOKING_SETTINGS.timeZone }).format(new Date(value)) : "—";
}
export default function MessageStatusList({ messages }: { messages: NotificationMessage[] }) {
  if (!messages.length) return <p>{copy.noMessages}</p>;
  return <ul className="notification-message-list">{messages.map((message, index) => <li key={message.id ?? index}>
    <div><strong>{notificationAudience(message.channel)}</strong><p>{notificationKind(message.kind)}</p></div>
    <span className="notification-status" data-state={notificationState(message)}>{notificationStateLabel(message)}</span>
    <dl><div><dt>{copy.scheduled}</dt><dd>{stamp(message.availableAt)}</dd></div>
      <div><dt>{copy.updated}</dt><dd>{stamp(message.deliveryAt ?? message.updatedAt)}</dd></div>
      <div><dt>{copy.attempts}</dt><dd>{message.attempts ?? "—"}</dd></div></dl>
  </li>)}</ul>;
}
