// Server component: permission-checked workspace and organisation-scoped activity log.
import ActivityLog from "@/features/activity/ActivityLog";
import "@/features/clinical/styles.css";
import "@/features/activity/styles.css";
import Link from "next/link";
import { connection } from "next/server";
import { authorisedRead } from "@/features/auth/authorize";
import { authConfigured } from "@/lib/auth-env";
import { AUTH_COPY, hasPermission } from "@/config/auth";
import NotificationCenter from "@/features/notifications/NotificationCenter";
import { listNotificationFeed } from "@/features/notifications/repository";
import WorkspaceOverview from "@/features/auth/WorkspaceOverview";
import WorkspaceSecurity from "@/features/auth/WorkspaceSecurity";
import { ADMIN_COPY } from "@/config/admin";
import WorkspacePage from "@/features/auth/WorkspacePage";
export default async function Dashboard({ activity = false, security = false, activityQuery }: { activity?: boolean; security?: boolean; activityQuery?: Promise<Record<string, string | string[] | undefined>> }) {
  await connection();
  if (!authConfigured()) return <section className="admin-card"><h1>{AUTH_COPY.title}</h1><p>{AUTH_COPY.unavailable}</p></section>;
  const result = await authorisedRead(activity ? "audit:read" : "portal:read", activity ? await activityQuery ?? {} : {});
  if (!result.actor) return <section className="admin-card"><h1>{AUTH_COPY.denied}</h1><Link href="/emcrown-admin">{AUTH_COPY.home}</Link></section>;
  const { actor } = result;
  const notices = !activity && !security && hasPermission(actor.role, "appointments:read") ? await listNotificationFeed({ page: 0 }) : null;
  return <WorkspacePage title={activity ? AUTH_COPY.audit : security ? ADMIN_COPY.security : ADMIN_COPY.overview}>
    {security ? <WorkspaceSecurity canManage={hasPermission(actor.role, "members:manage")} /> : !activity && <WorkspaceOverview role={actor.role} canAudit={hasPermission(actor.role, "audit:read")} />}
    {!activity && !security && hasPermission(actor.role, "appointments:read") && <NotificationCenter initial={notices?.ok ? notices.data : null} compact />}
    {activity && result.activity && <ActivityLog data={result.activity} />}
  </WorkspacePage>;
}
