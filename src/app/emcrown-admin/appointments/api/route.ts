// Server endpoint: audited appointment inbox and transactional status/rebooking actions.
import { clinicalHttp, clinicalBody } from "@/features/clinical/http";
import { listAppointments, changeAppointment } from "@/features/appointments/repository";
export async function GET(request: Request) {
  const input = Object.fromEntries(new URL(request.url).searchParams);
  return clinicalHttp(request, () => listAppointments(input));
}
export async function POST(request: Request) { return clinicalHttp(request, async () => changeAppointment(await clinicalBody(request))); }
