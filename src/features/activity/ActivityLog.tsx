// Server history view: filtered totals, stable pages and explicitly unknown actor attribution.
import { ACTIVITY_COPY as c } from "@/config/activity";
import { AUTH_COPY } from "@/config/auth";
import type { ActivityData } from "@/features/activity/repository";
import { activityHref } from "@/features/activity/filters";
import ActivityFilters from "@/features/activity/ActivityFilters";
import { auditMessage, auditOutcome } from "@/lib/audit-message";
const format = (date: Date) => new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }).format(date);
export default function ActivityLog({ data }: { data: ActivityData }) {
  const { filters, events, invalid } = data;
  const actorLabels = new Map(data.actors.map(actor => [actor.id, actor.email]));
  const refresh = activityHref(filters, { page: 1, snapshot: undefined });
  return <section className="workspace-activity">
    <p className="workspace-activity-intro">{AUTH_COPY.auditIntro}</p>
    <ActivityFilters key={JSON.stringify(filters)} filters={filters} invalid={invalid} actors={data.actors} />
    {invalid ? <p className="clinical-error" role="alert">{c.invalid}</p> : <>
      <dl className="activity-totals">{(["total", "success", "failure", "denied"] as const).map(key => <div key={key}><dt>{c[key]}</dt><dd className={`result-${key}`}>{data[key].toLocaleString("en")}</dd></div>)}</dl>
      <div className="activity-snapshot"><p>{c.snapshot} <time dateTime={filters.snapshot}>{format(new Date(filters.snapshot!))} UTC</time><small>{c.snapshotHelp}</small></p>
        <a href={refresh} data-intent="secondary">{c.refresh}</a></div>
      <div className="workspace-events" aria-label={c.results}>{events.length ? events.map(event => <article key={event.id} className="workspace-event"><dl>
        <div><dt>{AUTH_COPY.auditColumns[0]}</dt><dd><time dateTime={event.createdAt.toISOString()}>{format(event.createdAt)}</time></dd></div>
        <div className="workspace-event-description"><dt>{AUTH_COPY.auditColumns[1]}</dt><dd>{auditMessage(event.action, event.outcome)}<code>{event.action}</code></dd></div>
        <div><dt>{c.actor}</dt><dd>{event.actorId ? actorLabels.get(event.actorId) ?? event.actorId : c.unidentified}{event.actorId && actorLabels.get(event.actorId) && <code>{event.actorId}</code>}</dd></div>
        <div><dt>{AUTH_COPY.auditColumns[3]}</dt><dd>{event.actorRole?.replaceAll("_", " ") ?? c.noRole}</dd></div>
        <div><dt>{AUTH_COPY.auditColumns[4]}</dt><dd className={`event-result result-${event.outcome}`}>{auditOutcome(event.outcome)}</dd></div>
      </dl></article>) : <div className="workspace-panel"><h2>{c.empty}</h2><p>{c.emptyHelp}</p></div>}</div>
      <nav className="clinical-actions activity-pagination" aria-label={c.pagination}>
        {filters.page > 1 && <a data-intent="secondary" href={activityHref(filters, { page: filters.page - 1 })}>{c.previous}</a>}
        <span>{c.page} {filters.page} {c.of} {data.pageCount.toLocaleString("en")}</span>
        {filters.page < data.pageCount && <a data-intent="secondary" href={activityHref(filters, { page: filters.page + 1 })}>{c.next}</a>}
      </nav>
    </>}
  </section>;
}
