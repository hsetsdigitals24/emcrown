// Client bearer page: remove fragments immediately and show no patient identifiers or clinical details.
"use client";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { CLINICAL_COPY as c } from "@/config/clinical";
import { BOOKING_SETTINGS } from "@/config/booking";
import { clinicalRequest } from "@/features/clinical/client";
import { availabilitySchema } from "@/features/clinical/contracts";
import { formatDay, formatTime, practiceDate } from "@/features/booking/time";
const schema = z.object({ startUtc: z.iso.datetime(), endUtc: z.iso.datetime(), physicianId: z.uuid(), typeId: z.string(), locationId: z.string(), slots: availabilitySchema });
export default function ManageBooking() {
  const token = useRef(""); const [data, setData] = useState<z.infer<typeof schema>>(); const [error, setError] = useState("");
  const [done, setDone] = useState(false); const [busy, setBusy] = useState(false); const [selected, setSelected] = useState("");
  useEffect(() => {
    // The token is never a query parameter, referrer, analytics property or persisted browser value.
    token.current ||= window.location.hash.slice(1); window.history.replaceState(null, "", window.location.pathname);
    void clinicalRequest("/api/booking/manage", schema, { token: token.current, operation: "view" }).then(result => {
      if (result.ok) setData(result.data); else setError(c.tokenError);
    });
  }, []);
  async function mutate(operation: "cancel" | "rebook") {
    if (!data || busy || (operation === "cancel" && !window.confirm(c.confirmCancel))) return;
    setBusy(true); setError("");
    const target = data.slots.find(slot => slot.startUtc === selected && slot.physicianId === data.physicianId && slot.locationId === data.locationId && slot.typeId === data.typeId);
    try {
      const result = await clinicalRequest("/api/booking/manage", z.object({ updated: z.literal(true) }), { token: token.current, operation,
        ...(operation === "rebook" && target ? { slot: { physicianId: target.physicianId, locationId: target.locationId, typeId: target.typeId, startUtc: target.startUtc } } : {}) });
      if (result.ok) { token.current = ""; setData(undefined); setDone(true); } else setError(result.code === "conflict" ? c.conflict : c.tokenError);
    } finally { setBusy(false); }
  }
  const label = (stamp: string) => `${formatDay(practiceDate(stamp, BOOKING_SETTINGS.timeZone), BOOKING_SETTINGS.timeZone, "en-US")} · ${formatTime(stamp, BOOKING_SETTINGS.timeZone, "en-US")}`;
  return <section className="clinical-booking"><h1>{c.manage}</h1><p>{c.manageIntro}</p>{error && <p role="alert" className="clinical-error">{error}</p>}{done && <p role="status">{c.manageSaved}</p>}
    {data && <div className="clinical-panel"><p>{label(data.startUtc)}</p><fieldset disabled={busy}><label className="clinical-field">{c.start}<select value={selected} onChange={event => setSelected(event.target.value)}><option value="">{c.select}</option>
      {data.slots.filter(slot => slot.physicianId === data.physicianId && slot.typeId === data.typeId && slot.locationId === data.locationId).map(slot => <option key={slot.startUtc} value={slot.startUtc}>{label(slot.startUtc)}</option>)}</select></label>
      <div className="clinical-actions"><button onClick={() => void mutate("cancel")}>{c.cancelVisit}</button><button disabled={!selected} onClick={() => void mutate("rebook")}>{c.rebook}</button></div></fieldset></div>}
  </section>;
}
