// Server scheduler endpoint: external GET/POST jobs share bearer auth, rate limits and runtime checks.
import { constantEqual } from "@/features/clinical/encryption";
import { assertClinicalRuntime } from "@/features/clinical/runtime";
import { deliverAppointments } from "@/features/appointments/worker";
import { allowAttempt } from "@/features/auth/rate-limit";
import { clinicalJson } from "@/features/clinical/http";
export const maxDuration = 120;
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || secret.length < 32 || !constantEqual(request.headers.get("authorization") ?? "", `Bearer ${secret}`)) return clinicalJson({ ok: false }, 401);
  let stage = "database-runtime";
  try {
    await assertClinicalRuntime();
    stage = "rate-limit";
    if (!await allowAttempt("clinical:worker", "scheduler", 120)) return clinicalJson({ ok: false }, 429);
    stage = "delivery-worker";
    return clinicalJson({ ok: true, processed: await deliverAppointments(5) });
  } catch {
    // Raw exceptions may contain database queries or recipient details; log only fixed stage names.
    console.error("Appointment worker unavailable", { stage });
    return clinicalJson({ ok: false }, 503);
  }
}

// External schedulers can use POST; GET remains compatible with Vercel Cron.
export const POST = GET;
