// Server endpoint: same session/rate/tenant boundary as appointment inbox reads.
import { clinicalHttp } from "@/features/clinical/http";
import { listNotificationFeed } from "@/features/notifications/repository";
export async function GET(request: Request) {
  return clinicalHttp(request, () => listNotificationFeed(Object.fromEntries(new URL(request.url).searchParams)));
}
