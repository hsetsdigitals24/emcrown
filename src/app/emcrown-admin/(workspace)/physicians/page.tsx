// Server page: enforce MFA/role before decrypting physician records for the private workspace.
import type { Metadata } from "next";
import { authorisedRead } from "@/features/auth/authorize";
import WorkspacePage from "@/features/auth/WorkspacePage";
import { CLINICAL_COPY as c } from "@/config/clinical";
import { AUTH_COPY, hasPermission } from "@/config/auth";
import { clinicalConfigured } from "@/features/clinical/encryption";
import { listPhysicians } from "@/features/physicians/repository";
import PhysicianWorkspace from "@/features/physicians/PhysicianWorkspace";
import "@/features/clinical/styles.css";
export const metadata: Metadata = { title: "Physicians | Emcrown workspace", description: "Private physician records.", robots: { index: false, follow: false } };
export default async function Page() {
  const result = await authorisedRead("physicians:read"); if (!result.actor) return <p>{AUTH_COPY.denied}</p>;
  const records = clinicalConfigured() ? await listPhysicians() : null;
  return <WorkspacePage title={c.physicians}>{records?.ok
    ? <PhysicianWorkspace initial={records.data} canManage={hasPermission(result.actor.role, "physicians:manage")} /> : <p role="status">{c.setup}</p>}</WorkspacePage>;
}
