// Client state hook: local selections/contact only; all validation errors use static copy keys.
"use client";
import { useReducer, useState } from "react";
import type { BookingAction, BookingErrors, BookingSettings, BookingStep, MockSchedule } from "@/types/booking";
import { bookingReducer, initialBookingState } from "@/features/booking/state";
import { validateDetails, validateSelection } from "@/features/booking/validation";
import useMockAvailability from "@/features/booking/useMockAvailability";
import useDemoCompletion from "@/features/booking/useDemoCompletion";
function focusInvalid(errors: BookingErrors) {
  const first = Object.keys(errors)[0];
  const groups = { typeRequired: "appointmentType", providerRequired: "provider", dateRequired: "date", slotRequired: "slot" };
  const group = errors.selection && errors.selection in groups ? groups[errors.selection as keyof typeof groups] : "date";
  queueMicrotask(() => (document.querySelector<HTMLElement>(first === "selection" ? `input[name="${group}"]` : `#booking-${first}`) ?? document.querySelector<HTMLElement>(".booking-options input"))?.focus());
}
export default function useBookingFlow(settings: BookingSettings, schedule: MockSchedule) {
  const [state, dispatch] = useReducer(bookingReducer, settings, initialBookingState);
  const [errors, setErrors] = useState<BookingErrors>({});
  const mock = useMockAvailability(schedule, settings);
  const completion = useDemoCompletion(settings, () => dispatch({ type: "complete" }));
  function update(action: BookingAction) { setErrors({}); dispatch(action); }
  function advance() {
    const selectionErrors = validateSelection(state.selection, settings, schedule, state.step);
    const nextErrors = state.step === 3 ? { ...validateDetails(state.details, settings, schedule.referenceUtc), ...selectionErrors } : selectionErrors;
    if (Object.keys(nextErrors).length) { setErrors(nextErrors); focusInvalid(nextErrors); return; }
    if (state.phase === "review") { completion.complete(); return; }
    if (state.step === 3) update({ type: "review" });
    else update({ type: "step", step: (state.step + 1) as BookingStep });
  }
  function changeSelection(action: BookingAction) { mock.reset(); completion.reset(); update(action); }
  function chooseDate(id: string) { update({ type: "date", id }); mock.load({ ...state.selection, dateId: id, slotId: "" }); }
  function reset() { mock.reset(true); completion.reset(); update({ type: "reset", initial: initialBookingState(settings) }); }
  return { state, errors, mock, completion, update, advance, changeSelection, chooseDate, reset };
}
