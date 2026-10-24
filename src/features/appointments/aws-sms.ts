// Server-only AWS SMS adapter: SDK signing, bounded sends and no automatic duplicate retries.
import "server-only";
import { PinpointSMSVoiceV2Client, SendTextMessageCommand } from "@aws-sdk/client-pinpoint-sms-voice-v2";
import { z } from "zod";
import type { smsEnv } from "@/features/clinical/env";
type AwsSmsEnv = Extract<ReturnType<typeof smsEnv>, { provider: "aws" }>;
const recipientSchema = z.string().regex(/^\+1[2-9]\d{9}$/);
const bodySchema = z.string().min(1).max(1600).refine(value => value.trim().length > 0);
export function createAwsSmsClient(region: string) {
  // A timeout after acceptance is ambiguous. The outbox requires manual reconciliation.
  return new PinpointSMSVoiceV2Client({ region, ignoreConfiguredEndpointUrls: true, maxAttempts: 1, requestHandler: { connectionTimeout: 5000, requestTimeout: 15000 } });
}
export async function sendAwsSms(env: AwsSmsEnv, to: string, text: string, options: { dryRun?: boolean; client?: PinpointSMSVoiceV2Client } = {}) {
  const client = options.client ?? createAwsSmsClient(env.AWS_REGION);
  try {
    const result = await client.send(new SendTextMessageCommand({
      DestinationPhoneNumber: recipientSchema.parse(to), MessageBody: bodySchema.parse(text),
      OriginationIdentity: env.AWS_SMS_ORIGINATION_IDENTITY,
      ConfigurationSetName: env.AWS_SMS_CONFIGURATION_SET,
      ProtectConfigurationId: env.AWS_SMS_PROTECT_CONFIGURATION_ID,
      MessageType: "TRANSACTIONAL", MaxPrice: env.AWS_SMS_MAX_PRICE,
      TimeToLive: 300, DryRun: options.dryRun ?? false,
    }), { abortSignal: AbortSignal.timeout(15000) });
    if (options.dryRun) return null;
    return z.string().min(1).max(256).parse(result.MessageId);
  } catch {
    // SDK errors may contain provider/request details; never let them reach logs or UI.
    throw new Error("SMS delivery unavailable.");
  } finally {
    if (!options.client) client.destroy();
  }
}
