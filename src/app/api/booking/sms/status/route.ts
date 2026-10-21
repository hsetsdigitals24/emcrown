// Server SMS delivery webhook: retain only opaque provider IDs and generic delivery state.
import { signedSmsForm, recordSmsStatus } from "@/features/appointments/sms";
export async function POST(request: Request) {
  try {
    const form = await signedSmsForm(request, "/api/booking/sms/status"); if (!form) return new Response(null, { status: 403 });
    await recordSmsStatus(form); return new Response(null, { status: 204 });
  } catch { return new Response(null, { status: 400 }); }
}
