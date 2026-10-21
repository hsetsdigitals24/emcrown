// Client presentation: orange is reserved for final demo booking confirmation.
"use client";
import Button from "@/components/ui/Button";
import type { BookingCopy } from "@/config/booking-copy";
import type { BookingState } from "@/types/booking";
export default function BookingActions({ state, copy, busy, onBack, onEdit, onRestart }: {
  state: BookingState; copy: BookingCopy; busy: boolean; onBack: () => void; onEdit: () => void; onRestart: () => void;
}) {
  if (state.phase === "complete") return <Button className="booking-action-primary" purpose="primary" onClick={onRestart}>{copy.reset}</Button>;
  return <div className="booking-actions">
    {(state.step > 0 || state.phase === "review") && <Button disabled={busy} onClick={onBack}>{state.phase === "review" ? copy.edit : copy.back}</Button>}
    {state.phase === "review" && <Button disabled={busy} onClick={onEdit}>{copy.editAppointment}</Button>}
    <Button type="submit" disabled={busy} purpose={state.phase === "review" ? "booking" : "primary"} className={state.phase === "review" ? "booking-action-confirm" : "booking-action-primary"}>
      {busy && state.phase === "review" ? copy.confirming : state.phase === "review" ? copy.confirm : state.step === 3 ? copy.review : copy.next}
    </Button>
  </div>;
}
