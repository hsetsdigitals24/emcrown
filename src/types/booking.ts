// Shared booking contracts: separate public availability from in-memory contact details.
export type BookingStep = 0 | 1 | 2 | 3;
export type BookingPhase = "editing" | "review" | "complete";
export type AppointmentType = { id: string; label: string; description: string; durationMinutes: number; leadHours: number; providerIds: string[] };
export type MockProvider = { id: string; label: string; specialty: string };
export type MockDay = { id: string; scenario: "ready" | "unavailable" | "error" };
export type MockSlot = { id: string; dateId: string; providerId: string; locationId: string; startUtc: string };
export type MockSchedule = { referenceUtc: string; days: MockDay[]; slots: MockSlot[] };
export type BookingSelection = { typeId: string; providerId: string; locationId: string; dateId: string; slotId: string };
export type BookingDetails = { name: string; phone: string; email: string; dateOfBirth: string; reason: string; smsConsent: boolean; emailConsent: boolean };
export type DetailField = keyof BookingDetails;
export type BookingError = "typeRequired" | "providerRequired" | "dateRequired" | "slotRequired" | "nameRequired" | "phoneInvalid" | "emailInvalid" | "birthInvalid" | "reasonRequired" | "consentInvalid";
export type BookingErrors = Partial<Record<DetailField | "selection", BookingError>>;
export type BookingState = { step: BookingStep; phase: BookingPhase; selection: BookingSelection; details: BookingDetails };
export type BookingAction =
  | { type: "provider" | "location" | "date" | "slot"; id: string }
  | { type: "appointmentType"; id: string; firstAvailableId: string }
  | { type: "reset"; initial: BookingState }
  | { type: "details"; details: BookingDetails }
  | { type: "step"; step: BookingStep }
  | { type: "review" | "editing" | "complete" };
export type BookingSettings = {
  timeZone: string; locale: string; types: AppointmentType[]; providers: MockProvider[];
  initialProviderId?: string; firstAvailableId: string; locationIds: string[]; defaultLocationId: string; dayOffsets: number[];
  unavailableOffset: number; errorOffset: number;
  delayMs: number; confirmationFails: boolean; reasonLimit: number; nameLimit: number;
};
export type AvailabilityState = { status: "idle" | "loading" | "ready" | "unavailable" | "error"; slots: MockSlot[] };
