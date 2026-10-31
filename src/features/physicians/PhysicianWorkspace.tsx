// Client physician workspace: list private records and preserve editor state until explicit navigation.
"use client";
import { physicianName } from "@/lib/physician-name";
import { useState } from "react";
import { z } from "zod";
import type { Physician } from "@/types/clinical";
import { PHYSICIAN_FORM as copy } from "@/config/clinical-form";
import { CLINICAL_COPY as c } from "@/config/clinical";
import { physicianSchema } from "@/features/clinical/validation";
import { clinicalRequest } from "@/features/clinical/client";
import PhysicianForm from "@/features/physicians/PhysicianForm";
import PhysicianSettings from "@/features/physicians/PhysicianSettings";
import { useToast } from "@/components/ui/ToastProvider";
const recordSchema = physicianSchema.extend({ id: z.uuid(), version: z.number().int().positive(), published: z.boolean(), documentId: z.uuid().optional() });
export default function PhysicianWorkspace({ initial, canManage }: { initial: Physician[]; canManage: boolean }) {
  const [records, setRecords] = useState(initial); const [selected, setSelected] = useState<string>();
  const notify = useToast();
  async function refresh(id?: string) {
    const result = await clinicalRequest("/emcrown-admin/physicians/api", z.array(recordSchema));
    if (!result.ok) { notify(c.error); return; }
    setRecords(result.data); setSelected(id);
  }
  const physician = records.find(record => record.id === selected);
  if (selected && canManage) return <PhysicianForm key={`${selected}:${physician?.version ?? 0}`} physician={physician} onSaved={refresh} onBack={() => { void refresh(); }} />;
  return <section className="clinical-panel"><p>{c.physicianIntro}</p>{canManage && <div className="clinical-actions"><button data-intent="primary" onClick={() => setSelected("new")}>{c.create}</button></div>}
    {!records.length ? <p>{c.emptyPhysicians}</p> : <ul className="clinical-list">{records.map(record => <li key={record.id}>
      <h2>{physicianName(record)}</h2><p>{record.email} {record.phone}</p><p>{record.published ? copy.visible : copy.hidden} · {record.active ? copy.accepting : copy.paused}</p>
      {canManage && <button data-intent="primary" className="clinical-button" onClick={() => setSelected(record.id)}>{c.edit}</button>}
      {canManage && <PhysicianSettings physician={record} onChanged={refresh} />}
    </li>)}</ul>}
  </section>;
}
