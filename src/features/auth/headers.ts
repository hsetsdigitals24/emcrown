// Server request policy: unique script nonces, no shared caching and no referrer leakage.
import { NextResponse, type NextRequest } from "next/server";
export function adminResponse(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const development = process.env.NODE_ENV === "development";
  const booking = request.nextUrl.pathname === "/book" || request.nextUrl.pathname.startsWith("/book/");
  const challenge = booking && process.env.CLINICAL_INTEGRATIONS_APPROVED === "true";
  const preview = request.nextUrl.pathname === "/emcrown-admin/cms/preview";
  const physicians = request.nextUrl.pathname.startsWith("/emcrown-admin/physicians");
  const cms = request.nextUrl.pathname.startsWith("/emcrown-admin/cms");
  const policy = [
    "default-src 'self'", `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${development ? " 'unsafe-eval'" : ""}`,
    `style-src 'self'${development ? " 'unsafe-inline'" : ` 'nonce-${nonce}'`}`,
    `img-src 'self' data:${physicians ? " https:" : ""}`, "font-src 'self'", "object-src 'none'", "base-uri 'none'",
    ...(challenge ? ["frame-src https://challenges.cloudflare.com"] : []),
    "form-action 'self'", preview ? "frame-ancestors 'self'" : "frame-ancestors 'none'", `connect-src 'self'${development ? " ws: wss:" : ""}`,
    ...(physicians ? ["worker-src 'self'"] : []),
    ...(cms ? ["style-src-attr 'unsafe-inline'"] : []),
    ...(!development ? ["upgrade-insecure-requests"] : []),
  ].join("; ");
  const headers = new Headers(request.headers);
  headers.set("x-nonce", nonce);
  headers.set("Content-Security-Policy", policy);
  const response = NextResponse.next({ request: { headers } });
  response.headers.set("Content-Security-Policy", policy);
  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  response.headers.set("Referrer-Policy", "no-referrer");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", preview ? "SAMEORIGIN" : "DENY");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");
  response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  if (!development) response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains");
  return response;
}
