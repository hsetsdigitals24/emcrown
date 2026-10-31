// Shared clinical data contracts are inferred from validated boundary schemas.
import type { z } from "zod";
import type { physicianSchema, scheduleSchema, patientSchema } from "@/features/clinical/validation";
export type PhysicianProfile = z.infer<typeof physicianSchema>;
export type Physician = PhysicianProfile & { id: string; version: number; published: boolean; documentId?: string };
export type ProviderSchedule = z.infer<typeof scheduleSchema>;
export type PatientDetails = z.infer<typeof patientSchema>;
export type VisitStatus = "requested" | "confirmed" | "cancelled" | "completed" | "no_show";
export type PublicPhysician = Pick<PhysicianProfile, "fullName" | "title" | "bio" | "credentials" | "specialties" | "languages" | "photo" | "slug"> & { id: string; bookingAvailable: boolean };
export type Appointment = { id: string; physicianId: string; locationId: string; typeId: string; startUtc: string; endUtc: string; status: VisitStatus; version: number; patient: PatientDetails };
export type AvailabilitySlot = { physicianId: string; locationId: string; typeId: string; startUtc: string; endUtc: string; bufferMinutes: number };
export type ClinicalResult<T> = { ok: true; data: T } | { ok: false; code: "invalid" | "denied" | "conflict" | "unavailable" };
