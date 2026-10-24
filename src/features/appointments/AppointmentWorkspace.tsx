// Client workspace: keep patient visits separate from editable physician availability.
"use client";
import { useState } from "react";
import type { Physician } from "@/types/clinical";
import type { InboxData } from "@/features/clinical/contracts";
import type { PracticeConfig } from "@/types/public";
import { PRACTICE } from "@/config/practice";
import { BOOKING_SETTINGS } from "@/config/booking";
import { APPOINTMENT_WORKSPACE as copy } from "@/config/appointment-workspace";
import AppointmentNotifications from "@/features/notifications/AppointmentNotifications";
import { NOTIFICATION_COPY } from "@/config/notifications";
import AppointmentInbox from "@/features/appointments/AppointmentInbox";
import ScheduleEditor, { type ScheduleRecord } from "@/features/appointments/ScheduleEditor";
export default function AppointmentWorkspace({ initial, providers, schedules, canManage, canSchedule, live, practice = PRACTICE, tracking = false }: {
  tracking?: boolean; practice?: PracticeConfig; initial: InboxData; providers: Physician[]; schedules: ScheduleRecord[]; canManage: boolean; canSchedule: boolean; live: boolean;
}) {
  const [view, setView] = useState("inbox");
  return <div className="clinical-layout appointment-workspace">
    <div className={`appointment-booking-state ${live ? "is-live" : ""}`} role="status">
      <strong>{live ? copy.live : copy.paused}</strong>{!live && <p>{copy.pausedHelp}</p>}
      <small>{copy.zone} {BOOKING_SETTINGS.timeZone}</small>
    </div>
    <div className="appointment-task-switch" role="group" aria-label={copy.navigation}>
      {[{ id: "inbox", title: copy.inbox, help: copy.inboxHelp }, { id: "notifications", title: NOTIFICATION_COPY.management, help: NOTIFICATION_COPY.managementHelp }, ...(canSchedule ? [{ id: "availability", title: copy.availability, help: copy.availabilityHelp }] : [])].map(item =>
        <button type="button" key={item.id} aria-pressed={view === item.id} aria-controls={`appointment-${item.id}`} onClick={() => setView(item.id)}>
          <strong>{item.title}</strong><span>{item.help}</span>
        </button>)}
    </div>
    <div id="appointment-notifications" hidden={view !== "notifications"}><AppointmentNotifications initial={initial} providers={providers} canManage={canSchedule} tracking={tracking} /></div>
    <div id="appointment-inbox" hidden={view !== "inbox"}><AppointmentInbox locations={practice.locations} initial={initial} providers={providers} canManage={canManage} /></div>
    {canSchedule && <div id="appointment-availability" hidden={view !== "availability"}><ScheduleEditor locations={practice.locations} providers={providers} initial={schedules} /></div>}
  </div>;
}
