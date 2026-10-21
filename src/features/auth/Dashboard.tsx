// Server component: permission-checked workspace and organisation-scoped activity log.
import Link from "next/link";
import { connection } from "next/server";
import { authorisedRead } from "@/features/auth/authorize";
import { authConfigured } from "@/lib/auth-env";
import { AUTH_COPY, hasPermission } from "@/config/auth";
import WorkspaceOverview from "@/features/auth/WorkspaceOverview";
import WorkspaceSecurity from "@/features/auth/WorkspaceSecurity";
import { ADMIN_COPY } from "@/config/admin";
import WorkspaceShell from "@/features/auth/WorkspaceShell";
export default async function Dashboard({ activity = false, security = false }: { activity?: boolean; security?: boolean }) {
  await connection();
  if (!authConfigured()) return <section className="admin-card"><h1>{AUTH_COPY.title}</h1><p>{AUTH_COPY.unavailable}</p></section>;
  const result = await authorisedRead(activity ? "audit:read" : "portal:read");
  if (!result.actor) return <section className="admin-card"><h1>{AUTH_COPY.denied}</h1><Link href="/emcrown-admin">{AUTH_COPY.home}</Link></section>;
  const { actor, events } = result;
  return <WorkspaceShell actor={actor} title={activity ? AUTH_COPY.audit : security ? ADMIN_COPY.security : ADMIN_COPY.overview} overview={!activity && !security}>
    {security ? <WorkspaceSecurity canManage={hasPermission(actor.role, "members:manage")} /> : !activity && <WorkspaceOverview role={actor.role} canAudit={hasPermission(actor.role, "audit:read")} />}
    {activity && <section className="workspace-activity"><p className="workspace-activity-intro">{AUTH_COPY.auditIntro}</p>
      <div className="workspace-events">{events.length ? events.map(event => <article key={event.id} className="workspace-event">
      <dl>
        {[new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }).format(event.createdAt), event.action, event.actorId ?? "—", event.actorRole?.replaceAll("_", " ") ?? "—", event.outcome].map((value, index) =>
          <div key={index}><dt>{AUTH_COPY.auditColumns[index]}</dt><dd className={index === 4 ? `event-result result-${event.outcome}` : ""}>{value}</dd></div>)}
      </dl></article>) : <p className="workspace-panel">{AUTH_COPY.emptyAudit}</p>}</div></section>}
  </WorkspaceShell>;
}
