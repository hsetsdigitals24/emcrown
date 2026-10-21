// Server endpoint: configured working hours and blocked days, scoped to the current organisation.
import { clinicalHttp, clinicalBody } from "@/features/clinical/http";
import { listSchedules, writeSchedule } from "@/features/appointments/schedules";
export async function GET(request: Request) { return clinicalHttp(request, listSchedules); }
export async function POST(request: Request) { return clinicalHttp(request, async () => writeSchedule(await clinicalBody(request))); }
