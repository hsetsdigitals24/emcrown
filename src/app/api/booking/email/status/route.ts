// Server webhook: signed allowlisted SNS only; raw email events never enter logs or storage.
import { z } from "zod";
import { boundedBody } from "@/features/cms/http";
import { allowAttempt } from "@/features/auth/rate-limit";
import { emailEventEnv, emailEventsConfigured } from "@/features/notifications/env";
import { verifySns, confirmSns, SnsAuthenticationError } from "@/features/notifications/sns";
import { emailOutcome } from "@/features/notifications/email-event";
import { recordDelivery } from "@/features/notifications/record-delivery";
const response = (status: number) => new Response(null, { status, headers: { "Cache-Control": "no-store" } });
export async function POST(request: Request) {
  if (!emailEventsConfigured()) return response(404);
  try {
    if (!await allowAttempt("clinical:email-webhook", "sns", 5000)) return response(429);
    const env = emailEventEnv();
    let input: unknown;
    try { input = JSON.parse((await boundedBody(request, 262144)).toString("utf8")); } catch { return response(400); }
    let envelope;
    try { envelope = await verifySns(input, env.AWS_SES_EVENT_TOPIC_ARN); }
    catch (error) { return response(error instanceof SnsAuthenticationError || error instanceof z.ZodError ? 403 : 503); }
    if (envelope.Type === "SubscriptionConfirmation") { await confirmSns(envelope); return response(204); }
    let outcome;
    try { outcome = emailOutcome(JSON.parse(envelope.Message), env.CLINICAL_SMTP_FROM, env.AWS_SES_EVENT_TOPIC_ARN.split(":")[4]); }
    catch { return response(400); }
    if (outcome) await recordDelivery(outcome);
    return response(204);
  } catch { return response(503); }
}
