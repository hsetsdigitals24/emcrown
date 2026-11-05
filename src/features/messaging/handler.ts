// Server-only Lambda orchestration: no HTTP endpoint, bounded batches and no raw provider errors.
import "server-only";
import { z } from "zod";
import { assertWorkerRuntime } from "@/features/messaging/runtime";
import { deliverAppointments } from "@/features/appointments/worker";
import { deliverResetEmails } from "@/features/auth/mail";
import { closeDatabase } from "@/lib/db";
export { configureWorker } from "@/features/messaging/settings";
const eventSchema = z.object({ operation: z.enum(["check-configuration", "deliver-email"]) }).strict();
export type WorkerContext = { getRemainingTimeInMillis: () => number };
const services = { assertWorkerRuntime, deliverAppointments, deliverResetEmails, closeDatabase };
export async function runWorker(input: unknown, context: WorkerContext, dependencies = services) {
  const parsed = eventSchema.safeParse(input);
  if (!parsed.success) throw new Error("Invalid worker operation.");
  try {
    await dependencies.assertWorkerRuntime();
    if (parsed.data.operation === "check-configuration") return { ready: true };
    // Start no new message close to Lambda termination: killing an in-flight send is ambiguous.
    const canStart = () => context.getRemainingTimeInMillis() > 90000;
    let accounts = 0; let appointments = 0; let failed = false;
    try { if (canStart()) accounts = await dependencies.deliverResetEmails(5, canStart); } catch { failed = true; }
    try { if (canStart()) appointments = await dependencies.deliverAppointments(5, canStart); } catch { failed = true; }
    if (failed) throw new Error("Email worker invocation incomplete.");
    return { accounts, appointments };
  } finally { await dependencies.closeDatabase(); }
}
