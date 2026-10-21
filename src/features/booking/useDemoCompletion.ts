// Client hook: local completion state only; no appointment identifiers or notifications.
"use client";
import { useEffect, useRef, useState } from "react";
import type { BookingSettings } from "@/types/booking";
export default function useDemoCompletion(settings: BookingSettings, onComplete: () => void) {
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  function complete() {
    if (busy) return;
    setBusy(true); setFailed(false);
    timer.current = setTimeout(() => {
      setBusy(false);
      if (settings.confirmationFails) { setFailed(true); return; }
      onComplete();
    }, settings.delayMs);
  }
  function reset() {
    if (timer.current) clearTimeout(timer.current);
    setBusy(false); setFailed(false);
  }
  return { busy, failed, complete, reset };
}
