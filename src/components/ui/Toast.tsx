// Client notification: timed feedback with a separate exit phase and accessible pause controls.
"use client";
import { useEffect, useRef, useState } from "react";
import { ADMIN_COPY, TOAST_POLICY } from "@/config/admin";
export default function Toast({ message, success = false, duration = success ? TOAST_POLICY.successMs : TOAST_POLICY.errorMs, onDismiss }: { message: string; success?: boolean; duration?: number; onDismiss?: () => void }) {
  const [dismissed, setDismissed] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [paused, setPaused] = useState(false);
  const dismissCallback = useRef(onDismiss);
  useEffect(() => { dismissCallback.current = onDismiss; }, [onDismiss]);
  useEffect(() => {
    if (paused || exiting || dismissed || !message) return;
    const timer = window.setTimeout(() => setExiting(true), duration);
    return () => window.clearTimeout(timer);
  }, [duration, paused, exiting, dismissed, message]);
  // Keep the toast mounted until its exit animation finishes. Callback changes must not reset its timer.
  useEffect(() => {
    if (!exiting) return;
    const timer = window.setTimeout(() => { setDismissed(true); dismissCallback.current?.(); }, TOAST_POLICY.exitMs);
    return () => window.clearTimeout(timer);
  }, [exiting]);
  if (dismissed || !message) return null;
  return <div className={`admin-toast ${success ? "is-success" : "is-error"}${exiting ? " is-exiting" : ""}`} role={success ? "status" : "alert"}
    onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
    onFocus={() => setPaused(true)} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false); }}>
    <span className="toast-symbol" aria-hidden="true">{success ? "✓" : "!"}</span>
    <div><strong>{success ? ADMIN_COPY.success : ADMIN_COPY.error}</strong><p>{message}</p></div>
    <button type="button" onClick={() => setExiting(true)} aria-label={ADMIN_COPY.dismiss}>×</button>
  </div>;
}
