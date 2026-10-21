// Server-only bot verification: only an opaque challenge token is sent to the configured provider.
import "server-only";
import { z } from "zod";
import { liveBookingEnv } from "@/features/clinical/env";
import { authEnv } from "@/lib/auth-env";
export async function verifyBookingCaptcha(token: string) {
  const env = liveBookingEnv();
  try {
    const result = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST", body: new URLSearchParams({ secret: env.TURNSTILE_SECRET_KEY, response: token }),
      cache: "no-store", redirect: "error", signal: AbortSignal.timeout(10000),
    });
    const value = z.object({ success: z.boolean(), hostname: z.string(), action: z.string() }).safeParse(await result.json());
    return result.ok && value.success && value.data.success && value.data.hostname === new URL(authEnv().AUTH_ORIGIN).hostname && value.data.action === "booking";
  } catch { return false; }
}
