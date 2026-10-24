// Server page: authenticated notification feed, with no patient data in notification text.
import type { Metadata } from "next";
import { authorisedRead } from "@/features/auth/authorize";
import WorkspacePage from "@/features/auth/WorkspacePage";
import { AUTH_COPY } from "@/config/auth";
import { NOTIFICATION_COPY as copy } from "@/config/notifications";
import { listNotificationFeed } from "@/features/notifications/repository";
import NotificationCenter from "@/features/notifications/NotificationCenter";
export const metadata: Metadata = { title: "Notifications | Emcrown", robots: { index: false, follow: false } };
export default async function NotificationsPage() {
  const result = await authorisedRead("appointments:read");
  if (!result.actor) return <p>{AUTH_COPY.denied}</p>;
  const feed = await listNotificationFeed({ page: 0 });
  return <WorkspacePage title={copy.title}><p className="workspace-activity-intro">{copy.intro}</p><NotificationCenter initial={feed.ok ? feed.data : null} /></WorkspacePage>;
}
