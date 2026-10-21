// Server-only public booking boundary: exact origin, hashed IP rate limits and private responses.
import "server-only";
import { authEnv } from "@/lib/auth-env";
import { privateHash } from "@/features/clinical/encryption";
import { allowAttempt } from "@/features/auth/rate-limit";
export async function publicBookingAllowed(request: Request, scope: string) {
  if (request.method !== "GET" && request.headers.get("origin") !== authEnv().AUTH_ORIGIN) return false;
  // Vercel supplies x-vercel-forwarded-for; never store IPs or accept their use as identity proof.
  const address = request.headers.get("x-vercel-forwarded-for") ?? request.headers.get("x-forwarded-for") ?? "unknown";
  return await allowAttempt(`booking:${scope}:global`, "public", 3000) && await allowAttempt(`booking:${scope}`, privateHash(address.slice(0, 200)), scope === "submit" ? 12 : 120);
}
