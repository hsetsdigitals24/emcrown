// Server-only enrollment URI: reuse the existing session secret and label its account correctly.
import "server-only";
import { generateURI } from "otplib";
import { AUTH_POLICY } from "@/config/auth";
export function enrollmentUri(setupKey: string, email: string) {
  return generateURI({ issuer: AUTH_POLICY.issuer, label: email, secret: setupKey,
    strategy: "totp", algorithm: "sha1", digits: 6, period: 30 });
}
