// Server bearer endpoint: secrets stay in request bodies; origin/rate checks apply to reads and writes.
import { clinicalBody, clinicalJson } from "@/features/clinical/http";
import { publicBookingAllowed } from "@/features/appointments/public-http";
import { manageAppointment } from "@/features/appointments/manage";
export async function POST(request: Request) {
  try {
    if (!await publicBookingAllowed(request, "manage")) return clinicalJson({ ok: false, code: "denied" }, 429);
    const result = await manageAppointment(await clinicalBody(request));
    return clinicalJson(result, result.ok ? 200 : 400);
  } catch { return clinicalJson({ ok: false, code: "unavailable" }, 503); }
}
