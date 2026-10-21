// Shared reducer: dependent selections reset, and completion drops contact details.
import type { BookingAction, BookingDetails, BookingState, BookingSettings } from "@/types/booking";
export function emptyDetails(): BookingDetails { return { name: "", phone: "", email: "", dateOfBirth: "", reason: "", smsConsent: false, emailConsent: false }; }
export function initialBookingState(settings: BookingSettings): BookingState {
  return { step: 0, phase: "editing", details: emptyDetails(), selection: { typeId: "", providerId: settings.providers.some(provider => provider.id === settings.initialProviderId) ? settings.initialProviderId! : settings.firstAvailableId, locationId: settings.defaultLocationId, dateId: "", slotId: "" } };
}
export function bookingReducer(state: BookingState, action: BookingAction): BookingState {
  switch (action.type) {
    case "appointmentType": return { ...state, phase: "editing", selection: { ...state.selection, typeId: action.id, providerId: action.firstAvailableId, dateId: "", slotId: "" } };
    case "provider": return { ...state, phase: "editing", selection: { ...state.selection, providerId: action.id, dateId: "", slotId: "" } };
    case "location": return { ...state, phase: "editing", selection: { ...state.selection, locationId: action.id, dateId: "", slotId: "" } };
    case "date": return { ...state, selection: { ...state.selection, dateId: action.id, slotId: "" } };
    case "slot": return { ...state, selection: { ...state.selection, slotId: action.id } };
    case "details": return { ...state, details: action.details };
    case "step": return { ...state, step: action.step, phase: "editing" };
    case "review": return { ...state, phase: "review" };
    case "editing": return { ...state, phase: "editing" };
    case "complete": return { ...state, phase: "complete", details: emptyDetails() };
    case "reset": return action.initial;
  }
}
