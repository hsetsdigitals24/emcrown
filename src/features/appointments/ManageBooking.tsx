// Client bearer page: remove fragments immediately and show no patient identifiers or clinical details.
"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { z } from "zod";
import Image from "next/image";
import Link from "next/link";
import LiveDateTimePicker, { slotKey } from "@/features/appointments/LiveDateTimePicker";
import { MANAGE_COPY as copy } from "@/config/manage-booking";
import { CLINICAL_COPY as c } from "@/config/clinical";
import { BOOKING_SETTINGS } from "@/config/booking";
import { clinicalRequest } from "@/features/clinical/client";
import { availabilitySchema } from "@/features/clinical/contracts";
import { formatDay, formatTime, practiceDate } from "@/features/booking/time";
const schema = z.object({ startUtc: z.iso.datetime(), endUtc: z.iso.datetime(), physicianId: z.uuid(), typeId: z.string(), locationId: z.string(), slots: availabilitySchema, display: z.object({ physician: z.object({ name: z.string(), photo: z.string() }).optional(), location: z.string() }).optional() });
export default function ManageBooking() {
  const token = useRef(""); const [data, setData] = useState<z.infer<typeof schema>>(); const [error, setError] = useState("");
  const [done, setDone] = useState(false); const [busy, setBusy] = useState(false); const [selected, setSelected] = useState("");
  const [loading, setLoading] = useState(true); const [retry, setRetry] = useState(false);
  const load = useCallback(async () => {
    setLoading(true); setError(""); setRetry(false); setSelected("");
    if (!token.current) { setError(copy.missing); setLoading(false); return; }
    const result = await clinicalRequest("/api/booking/manage", schema, { token: token.current, operation: "view" });
    if (result.ok) setData(result.data);
    else { setError(result.code === "unavailable" ? copy.unavailable : c.tokenError); setRetry(result.code === "unavailable"); }
    setLoading(false);
  }, []);
  useEffect(() => {
    // Keep the bearer only in this mounted component, out of URLs, referrers and browser storage.
    token.current ||= window.location.hash.slice(1); window.history.replaceState(null, "", window.location.pathname);
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);
  async function mutate(operation: "cancel" | "rebook") {
    if (!data || busy || (operation === "cancel" && !window.confirm(c.confirmCancel))) return;
    setBusy(true); setError("");
    const target = data.slots.find(slot => slotKey(slot) === selected && slot.physicianId === data.physicianId && slot.locationId === data.locationId && slot.typeId === data.typeId);
    try {
      const result = await clinicalRequest("/api/booking/manage", z.object({ updated: z.literal(true) }), { token: token.current, operation,
        ...(operation === "rebook" && target ? { slot: { physicianId: target.physicianId, locationId: target.locationId, typeId: target.typeId, startUtc: target.startUtc } } : {}) });
      if (result.ok) { token.current = ""; setData(undefined); setDone(true); } else { setError(result.code === "conflict" ? c.conflict : result.code === "unavailable" ? copy.unavailable : c.tokenError); setRetry(true); }
    } finally { setBusy(false); }
  }
  const label = (stamp: string) => `${formatDay(practiceDate(stamp, BOOKING_SETTINGS.timeZone), BOOKING_SETTINGS.timeZone, "en-US")} · ${formatTime(stamp, BOOKING_SETTINGS.timeZone, "en-US")}`;
  const physician = data?.display?.physician;
  const slots = data?.slots.filter(slot => slot.physicianId === data.physicianId && slot.typeId === data.typeId && slot.locationId === data.locationId) ?? [];
  return <div className="manage-workspace" aria-busy={loading || busy}>
    {loading && <div className="manage-status" role="status"><p className="manage-kicker">{copy.secure}</p><h2>{copy.loading}</h2></div>}
    {error && <div className="manage-status" role="alert"><p className="manage-kicker">{copy.help}</p><h2>{copy.problem}</h2><p>{error}</p>
      <div className="clinical-actions">{retry && <button disabled={loading || busy} onClick={() => void load()}>{copy.retry}</button>}<a className="manage-link" href="/contact">{copy.contact}</a></div><p className="manage-note">{copy.linkHelp}</p></div>}
    {done && <div className="manage-status" role="status"><p className="manage-kicker">{copy.savedLabel}</p><h2>{c.manageSaved}</h2><p>{copy.saved}</p><Link className="manage-link" href="/">{copy.home}</Link></div>}
    {data && !done && <><div className="manage-summary"><p className="manage-kicker">{copy.current}</p><h2>{label(data.startUtc)}</h2><p>{BOOKING_SETTINGS.timeZone}</p>
      {physician && <div className="manage-physician">{physician.photo && <Image src={physician.photo} alt="" width={64} height={72} unoptimized referrerPolicy="no-referrer" />}<div><span>{c.provider}</span><p>{physician.name}</p></div></div>}
      <dl className="clinical-details"><div><dt>{c.location}</dt><dd>{data.display?.location}</dd></div><div><dt>{c.type}</dt><dd>{BOOKING_SETTINGS.types.find(type => type.id === data.typeId)?.label}</dd></div></dl><p className="manage-note">{copy.privacy}</p></div>
      <div className="clinical-panel"><h2>{copy.change}</h2><p>{copy.changeHelp}</p><fieldset disabled={busy}>
        {slots.length ? <LiveDateTimePicker slots={slots} providers={[]} value={selected} onChange={setSelected} today={practiceDate(new Date().toISOString(), BOOKING_SETTINGS.timeZone)} /> : <p>{c.noTimes}</p>}
        <div className="clinical-actions"><button disabled={!selected || busy} onClick={() => void mutate("rebook")}>{busy ? c.working : copy.save}</button></div>
      </fieldset><div className="manage-cancel"><h3>{copy.cancelTitle}</h3><p>{copy.cancelHelp}</p><div className="clinical-actions"><button className="manage-danger" disabled={busy} onClick={() => void mutate("cancel")}>{c.cancelVisit}</button></div></div></div></>}
  </div>;
}
