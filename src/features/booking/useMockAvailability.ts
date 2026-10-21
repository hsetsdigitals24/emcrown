// Client hook: cancellable local delay models loading/error states without any request.
"use client";
import { useEffect, useRef, useState } from "react";
import type { AvailabilityState, BookingSelection, BookingSettings, MockSchedule } from "@/types/booking";
import { availableMockSlots } from "@/features/booking/schedule";
export default function useMockAvailability(schedule: MockSchedule, settings: BookingSettings) {
  const [availability, setAvailability] = useState<AvailabilityState>({ status: "idle", slots: [] });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const attempts = useRef(new Set<string>());
  const cancel = () => { if (timer.current) clearTimeout(timer.current); };
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  function load(selection: BookingSelection) {
    cancel();
    setAvailability({ status: "loading", slots: [] });
    timer.current = setTimeout(() => {
      const day = schedule.days.find((item) => item.id === selection.dateId);
      if (day?.scenario === "error" && !attempts.current.has(day.id)) {
        attempts.current.add(day.id);
        setAvailability({ status: "error", slots: [] });
        return;
      }
      const slots = availableMockSlots(schedule, settings, selection);
      setAvailability({ status: slots.length ? "ready" : "unavailable", slots });
    }, settings.delayMs);
  }
  function reset(clearAttempts = false) {
    cancel();
    if (clearAttempts) attempts.current.clear();
    setAvailability({ status: "idle", slots: [] });
  }
  return { availability, load, reset };
}
