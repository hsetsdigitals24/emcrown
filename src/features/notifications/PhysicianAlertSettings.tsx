// Client preferences: explicit per-physician save through the existing version-checked API.
"use client";
import Link from "next/link";
import { useState } from "react";
import { z } from "zod";
import type { Physician } from "@/types/clinical";
import { physicianSchema } from "@/features/clinical/validation";
import { clinicalRequest } from "@/features/clinical/client";
import { NOTIFICATION_COPY as copy } from "@/config/notifications";
import { useToast } from "@/components/ui/ToastProvider";
export default function PhysicianAlertSettings({ providers }: { providers: Physician[] }) {
  const [records, setRecords] = useState(providers); const [busy, setBusy] = useState<string | null>(null);
  const notify = useToast();
  async function toggle(record: Physician, enabled: boolean) {
    if (busy || !record.email || !record.active) return;
    setBusy(record.id);
    const profile = { ...physicianSchema.strip().parse(record), notifyAppointments: enabled };
    const result = await clinicalRequest("/emcrown-admin/physicians/api", z.object({ id: z.uuid() }), { id: record.id, version: record.version, operation: "save", profile });
    setBusy(null);
    if (!result.ok) { notify(result.code === "conflict" ? copy.conflict : copy.error); return; }
    setRecords(current => current.map(item => item.id === record.id ? { ...item, notifyAppointments: enabled, version: item.version + 1 } : item));
    notify(copy.alertSaved, true);
  }
  return <section className="clinical-panel"><h2>{copy.alerts}</h2><p>{copy.alertsHelp}</p>
    {!records.length && <p>{copy.noPhysicians}</p>}
    <ul className="physician-alert-list">{records.map(record => <li key={record.id}><div><strong>{record.fullName}</strong><p>{record.email || copy.noEmail}</p></div>
      <label className="clinical-check"><input type="checkbox" checked={record.notifyAppointments} disabled={Boolean(busy) || !record.email || !record.active}
        onChange={event => void toggle(record, event.target.checked)} aria-label={`${copy.alertEnabled}: ${record.fullName}`} /><span>{copy.alertEnabled}</span></label></li>)}</ul>
    <Link className="workspace-text-link" href="/emcrown-admin/physicians" prefetch={false}>{copy.editPhysician} ↗</Link>
  </section>;
}
