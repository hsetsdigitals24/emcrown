// Server filter form: native GET navigation works without JavaScript and resets pagination.
import { ACTIVITY_COPY as c } from "@/config/activity";
import { AUDIT_ACTIONS } from "@/types/auth";
import { auditMessage } from "@/lib/audit-message";
import { activityFilterSchema, activityHref, type ActivityFilters as Filters } from "@/features/activity/filters";
import type { ActivityData } from "@/features/activity/repository";
function Select({ name, label, value, options }: { name: string; label: string; value: string; options: Record<string, string> }) {
  return <label className="clinical-field">{label}<select name={name} defaultValue={value}>
    {Object.entries(options).map(([key, text]) => <option value={key} key={key}>{text}</option>)}
  </select></label>;
}
export default function ActivityFilters({ filters, invalid, actors }: { filters: Filters; invalid: boolean; actors: ActivityData["actors"] }) {
  const base = activityFilterSchema.parse({});
  const quick = [[c.attention, { outcome: "attention", hideRoutine: "1" }], [c.today, { period: "today" }], [c.recent, { period: "week" }], [c.mine, { actor: "mine" }], [c.security, { category: "auth" }]] as const;
  return <section className="clinical-panel activity-filters" aria-labelledby="activity-filters-title">
    <h2 id="activity-filters-title">{c.title}</h2><p>{c.scope}</p>
    <nav className="activity-quick" aria-label={c.quick}>{quick.map(([label, changes]) => <a key={label} href={activityHref(base, changes)}>{label}</a>)}</nav>
    <form action="/emcrown-admin/activity" method="get">
      <div className="clinical-fields">
        <Select name="period" label={c.period} value={filters.period} options={c.periods} />
        <Select name="category" label={c.category} value={filters.category} options={c.categories} />
        <label className="clinical-field">{c.action}<select name="action" defaultValue={filters.action ?? ""}>
          <option value="">{c.allActions}</option>{AUDIT_ACTIONS.map(action => <option key={action} value={action}>{action} — {auditMessage(action, "success")}</option>)}
        </select></label>
        <Select name="outcome" label={c.result} value={filters.outcome} options={c.outcomes} />
        <Select name="role" label={c.role} value={filters.role} options={c.roles} />
        <Select name="actor" label={c.actor} value={filters.actor} options={{ ...c.actors, ...Object.fromEntries(actors.flatMap(actor => actor.id ? [[actor.id, actor.email ?? actor.id]] : [])) }} />
      </div>
      <details className="activity-advanced" open={filters.period === "custom" || Boolean(filters.actorId) || invalid}>
        <summary>{c.advanced}</summary><p>{c.datesHelp}</p><div className="clinical-fields">
          <label className="clinical-field">{c.from}<input name="from" type="date" defaultValue={filters.from ?? ""} /></label>
          <label className="clinical-field">{c.to}<input name="to" type="date" defaultValue={filters.to ?? ""} /></label>
          <label className="clinical-field">{c.actorId}<input name="actorId" defaultValue={filters.actorId ?? ""} maxLength={36} placeholder={c.actorPlaceholder} aria-describedby="activity-actor-help" /></label>
        </div><p id="activity-actor-help">{c.actorHelp}</p>
      </details>
      <label className="clinical-check"><input name="hideRoutine" type="checkbox" value="1" defaultChecked={Boolean(filters.hideRoutine)} />{c.hideRoutine}</label>
      <div className="clinical-actions"><button data-intent="primary" type="submit">{c.apply}</button><a data-intent="secondary" href="/emcrown-admin/activity">{c.reset}</a></div>
    </form>
  </section>;
}
