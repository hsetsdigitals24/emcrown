// Server component: permission-checked workspace and organisation-scoped activity log.
import { auditMessage, auditOutcome } from "@/lib/audit-message";
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
export default async function Dashboard({ activity = false, security = false }: { activity?: boolean; security?: boolean }) {
  await connection();
  if (!authConfigured()) return <section className="admin-card"><h1>{AUTH_COPY.title}</h1><p>{AUTH_COPY.unavailable}</p></section>;
  const result = await authorisedRead(activity ? "audit:read" : "portal:read");
  if (!result.actor) return <section className="admin-card"><h1>{AUTH_COPY.denied}</h1><Link href="/emcrown-admin">{AUTH_COPY.home}</Link></section>;
  const { actor, events } = result;
  const notices = !activity && !security && hasPermission(actor.role, "appointments:read") ? await listNotificationFeed({ page: 0 }) : null;
  return <WorkspacePage title={activity ? AUTH_COPY.audit : security ? ADMIN_COPY.security : ADMIN_COPY.overview}>
    {security ? <WorkspaceSecurity canManage={hasPermission(actor.role, "members:manage")} /> : !activity && <WorkspaceOverview role={actor.role} canAudit={hasPermission(actor.role, "audit:read")} />}
    {!activity && !security && hasPermission(actor.role, "appointments:read") && <NotificationCenter initial={notices?.ok ? notices.data : null} compact />}
    {activity && <section className="workspace-activity"><p className="workspace-activity-intro">{AUTH_COPY.auditIntro}</p>
      <div className="workspace-events">{events.length ? events.map(event => <article key={event.id} className="workspace-event">
      <dl>
        <div><dt>{AUTH_COPY.auditColumns[0]}</dt><dd><time dateTime={event.createdAt.toISOString()}>{new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }).format(event.createdAt)}</time></dd></div>
        <div className="workspace-event-description"><dt>{AUTH_COPY.auditColumns[1]}</dt><dd>{auditMessage(event.action, event.outcome)}<code>{event.action}</code></dd></div>
        <div><dt>{AUTH_COPY.auditColumns[2]}</dt><dd>{event.actorId ?? "—"}</dd></div>
        <div><dt>{AUTH_COPY.auditColumns[3]}</dt><dd>{event.actorRole?.replaceAll("_", " ") ?? "—"}</dd></div>
        <div><dt>{AUTH_COPY.auditColumns[4]}</dt><dd className={`event-result result-${event.outcome}`}>{auditOutcome(event.outcome)}</dd></div>
      </dl></article>) : <p className="workspace-panel">{AUTH_COPY.emptyAudit}</p>}</div></section>}
  </WorkspacePage>;
}
