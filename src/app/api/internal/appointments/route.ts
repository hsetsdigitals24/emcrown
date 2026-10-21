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
  try {
    await assertClinicalRuntime();
    if (!await allowAttempt("clinical:worker", "scheduler", 120)) return clinicalJson({ ok: false }, 429);
    return clinicalJson({ ok: true, processed: await deliverAppointments(5) });
  } catch { return clinicalJson({ ok: false }, 503); }
}

// External schedulers can use POST; GET remains compatible with Vercel Cron.
export const POST = GET;
