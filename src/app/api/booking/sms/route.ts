// Server SMS consent webhook: signatures first; provider Advanced Opt-Out supplies STOP/HELP responses.
import { signedSmsForm, recordSmsConsent } from "@/features/appointments/sms";
export async function POST(request: Request) {
  try {
    const form = await signedSmsForm(request, "/api/booking/sms"); if (!form) return new Response(null, { status: 403 });
    await recordSmsConsent(form);
    return new Response("<Response></Response>", { headers: { "Content-Type": "application/xml", "Cache-Control": "no-store" } });
  } catch { return new Response(null, { status: 400 }); }
}
