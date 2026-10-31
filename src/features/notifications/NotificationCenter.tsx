// Client inbox: refresh only while visible; initial tenant-scoped data comes from the server.
"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { clinicalRequest } from "@/features/clinical/client";
import { notificationFeedSchema, type NotificationFeedData } from "@/features/notifications/contracts";
import { NOTIFICATION_COPY as copy, NOTIFICATION_EVENTS } from "@/config/notifications";
import { notificationAudience, notificationKind, notificationStateLabel } from "@/features/notifications/status";
import { BOOKING_SETTINGS } from "@/config/booking";
function stamp(value: string) { return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: BOOKING_SETTINGS.timeZone }).format(new Date(value)); }
export default function NotificationCenter({ initial, compact = false }: { initial: NotificationFeedData | null; compact?: boolean }) {
  const [data, setData] = useState(initial);
  const [busy, setBusy] = useState(false); const [error, setError] = useState(!initial);
  const page = data?.page ?? 0;
  const refresh = useCallback(async (nextPage = page) => {
    setBusy(true);
    const result = await clinicalRequest(`/emcrown-admin/notifications/api?page=${nextPage}`, notificationFeedSchema);
    setBusy(false); setError(!result.ok);
    if (result.ok) setData(result.data);
  }, [page]);
  useEffect(() => {
    const check = () => { if (document.visibilityState === "visible") void refresh(); };
    const timer = window.setInterval(check, 30000); window.addEventListener("focus", check);
    return () => { window.clearInterval(timer); window.removeEventListener("focus", check); };
  }, [refresh]);
  return <section className="notification-center" aria-busy={busy}>
    <div className="notification-heading"><div><p className="workspace-eyebrow">{copy.title}</p><h2>{compact ? copy.latest : copy.activity}</h2></div>
      <button type="button" className="notification-refresh" disabled={busy} onClick={() => void refresh()}>{copy.refresh}</button></div>
    {error && <p role="alert">{copy.error}</p>}
    {!!data?.attention.length && <aside className="notification-attention"><h3>{copy.attention} <span>{data.attention.length}{data.attention.length === 20 ? "+" : ""}</span></h3>
      {!compact && <ul>{data.attention.map(item => <li key={item.id}><strong>{notificationAudience(item.channel)}</strong><span>{notificationKind(item.kind)} · {notificationStateLabel({ ...item, appointmentId: item.id })}</span><time dateTime={item.at}>{stamp(item.at)}</time></li>)}</ul>}
      <Link href="/emcrown-admin/appointments" prefetch={false}>{copy.openAppointments}<span aria-hidden="true"> ↗</span></Link></aside>}
    {data && !data.events.length ? <div className="notification-empty"><h3>{copy.empty}</h3><p>{copy.emptyHelp}</p></div>
      : <ul className="notification-events">{data?.events.slice(0, compact ? 4 : 25).map(event => {
        const content = NOTIFICATION_EVENTS[event.action];
        return <li key={event.id}><span className="notification-dot" aria-hidden="true" /><div><h3>{content?.title ?? copy.latest}</h3><p>{content?.body ?? copy.intro}</p><time dateTime={event.at}>{stamp(event.at)}</time></div>
          <Link href="/emcrown-admin/appointments" prefetch={false} aria-label={`${content?.title ?? copy.latest}: ${copy.openAppointments}`}>↗</Link></li>;
      })}</ul>}
    <div className="notification-footer">{compact ? <Link href="/emcrown-admin/notifications" prefetch={false}>{copy.viewAll} ↗</Link> : <>
      <span>{copy.page} {page + 1}</span><button data-intent="secondary" type="button" disabled={busy || page === 0} onClick={() => void refresh(page - 1)}>{copy.previous}</button>
      <button data-intent="secondary" type="button" disabled={busy || !data?.hasMore} onClick={() => void refresh(page + 1)}>{copy.next}</button></>}</div>
  </section>;
}
