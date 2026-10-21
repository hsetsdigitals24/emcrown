// Server endpoint: private physician reads and writes are authorized again inside transactions.
import { clinicalHttp, clinicalBody } from "@/features/clinical/http";
import { listPhysicians, writePhysician } from "@/features/physicians/repository";
export async function GET(request: Request) { return clinicalHttp(request, listPhysicians); }
export async function POST(request: Request) { return clinicalHttp(request, async () => writePhysician(await clinicalBody(request))); }
