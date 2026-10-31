// Shared pure lifecycle rules: public visibility and booking availability are independent.
import type { z } from "zod";
import type { physicianWriteSchema } from "@/features/clinical/validation";
export type PhysicianOperation = z.infer<typeof physicianWriteSchema>["operation"];
export function physicianState(operation: PhysicianOperation, active: boolean, published: boolean) {
  return {
    // Archive remains a compatible alias for existing clients; it only pauses booking.
    active: operation === "pause" || operation === "archive" ? false : operation === "resume" ? true : active,
    published: operation === "publish" ? true : operation === "unpublish" ? false : published,
  };
}
