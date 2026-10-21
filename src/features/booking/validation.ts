// Shared input boundary: validate unknown contact input without echoing sensitive values.
import type { BookingDetails, BookingErrors, BookingSelection, BookingSettings, MockSchedule } from "@/types/booking";
import { availableMockSlots } from "@/features/booking/schedule";
import { practiceDate } from "@/features/booking/time";
function validBirthDate(value: string, today: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value > today) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
export function validateDetails(input: unknown, settings: BookingSettings, referenceUtc: string): BookingErrors {
  const record = input && typeof input === "object" ? input as Record<string, unknown> : {};
  const text = (key: keyof BookingDetails) => typeof record[key] === "string" ? (record[key] as string).trim() : "";
  const errors: BookingErrors = {};
  if (text("name").length < 2 || text("name").length > settings.nameLimit) errors.name = "nameRequired";
  const phone = text("phone");
  if (phone.length > 30 || !/^[+\d\s().-]+$/.test(phone) || !/^\+?[^+]*$/.test(phone) || phone.replace(/\D/g, "").length < 10 || phone.replace(/\D/g, "").length > 15) errors.phone = "phoneInvalid";
  if (text("email").length > 254 || /[\u0000-\u001f\u007f]/.test(text("email")) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text("email"))) errors.email = "emailInvalid";
  if (!validBirthDate(text("dateOfBirth"), practiceDate(referenceUtc, settings.timeZone))) errors.dateOfBirth = "birthInvalid";
  if (!text("reason") || text("reason").length > settings.reasonLimit) errors.reason = "reasonRequired";
  if (typeof record.smsConsent !== "boolean") errors.smsConsent = "consentInvalid";
  if (typeof record.emailConsent !== "boolean") errors.emailConsent = "consentInvalid";
  return errors;
}
export function validateSelection(selection: BookingSelection, settings: BookingSettings, schedule: MockSchedule, throughStep: number): BookingErrors {
  const type = settings.types.find((item) => item.id === selection.typeId);
  if (!type) return { selection: "typeRequired" };
  if (throughStep < 1) return {};
  if (!settings.locationIds.includes(selection.locationId)) return { selection: "providerRequired" };
  if (selection.providerId !== settings.firstAvailableId && (!type.providerIds.includes(selection.providerId) || !settings.providers.some((provider) => provider.id === selection.providerId))) return { selection: "providerRequired" };
  if (throughStep < 2) return {};
  if (!schedule.days.some((day) => day.id === selection.dateId)) return { selection: "dateRequired" };
  if (!availableMockSlots(schedule, settings, selection).some((slot) => slot.id === selection.slotId)) return { selection: "slotRequired" };
  return {};
}
