// Server visitor submission: fail closed, challenge/rate checks and atomic database reservation.
import { clinicalJson, clinicalBody } from "@/features/clinical/http";
import { bookingSchema } from "@/features/clinical/validation";
import { liveBookingConfigured, liveBookingEnv } from "@/features/clinical/env";
import { verifyBookingCaptcha } from "@/features/appointments/captcha";
import { publicBookingAllowed } from "@/features/appointments/public-http";
import { reserveAppointment } from "@/features/appointments/booking";
export async function POST(request: Request) {
  try {
    if (!liveBookingConfigured()) return clinicalJson({ ok: false, code: "unavailable" }, 503);
    if (!await publicBookingAllowed(request, "submit")) return clinicalJson({ ok: false, code: "denied" }, 429);
    const input = bookingSchema.safeParse(await clinicalBody(request));
    if (!input.success || (!liveBookingEnv().smsEnabled && input.data.patient.smsConsent)) return clinicalJson({ ok: false, code: "invalid" }, 400);
    if (!await verifyBookingCaptcha(input.data.captcha)) return clinicalJson({ ok: false, code: "denied" }, 403);
    const result = await reserveAppointment(input.data);
    return clinicalJson(result, result.ok ? 200 : result.code === "conflict" ? 409 : 400);
  } catch { return clinicalJson({ ok: false, code: "unavailable" }, 503); }
}
