// Server page: full MFA and permission precede every decrypted appointment projection.
import type { Metadata } from "next";
import { authorisedRead } from "@/features/auth/authorize";
import WorkspacePage from "@/features/auth/WorkspacePage";
import { CLINICAL_COPY as c } from "@/config/clinical";
import { AUTH_COPY, hasPermission } from "@/config/auth";
import { clinicalConfigured } from "@/features/clinical/encryption";
import { liveBookingConfigured } from "@/features/clinical/env";
import { listAppointments } from "@/features/appointments/repository";
import { listPhysicians } from "@/features/physicians/repository";
import { listSchedules } from "@/features/appointments/schedules";
import AppointmentWorkspace from "@/features/appointments/AppointmentWorkspace";
import "@/features/clinical/styles.css";
export const metadata: Metadata = { title: "Appointments | Emcrown workspace", description: "Private appointment management.", robots: { index: false, follow: false } };
export default async function Page() {
  const result = await authorisedRead("appointments:read"); if (!result.actor) return <p>{AUTH_COPY.denied}</p>;
  const [inbox, providers, schedules] = clinicalConfigured() ? await Promise.all([listAppointments({}), listPhysicians(), listSchedules()]) : [];
  return <WorkspacePage title={c.appointments}>{inbox?.ok && providers?.ok && schedules?.ok
    ? <AppointmentWorkspace initial={inbox.data} providers={providers.data} schedules={schedules.data} canManage={hasPermission(result.actor.role, "appointments:manage")}
      canSchedule={hasPermission(result.actor.role, "physicians:manage")} live={liveBookingConfigured()} /> : <p role="status">{c.setup}</p>}</WorkspacePage>;
}
