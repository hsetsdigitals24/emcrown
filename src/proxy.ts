// Server route guard: reject unknown mock catalog slugs before partial prerender streaming.
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SERVICE_ENTRIES, PHYSICIAN_ENTRIES, ARTICLE_ENTRIES } from "@/config/pages/catalogs";
import type { PublicEntry } from "@/types/public";
import { findPublicEntry } from "@/lib/public-entry";
import { adminResponse } from "@/features/auth/headers";
import { findDefinition } from "@/config/cms/registry";

export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === "/emcrown-admin" || request.nextUrl.pathname.startsWith("/emcrown-admin/")) return adminResponse(request);
  const path = request.nextUrl.pathname;
  if (path === "/book" || path.startsWith("/book/") || path.startsWith("/api/booking")) return adminResponse(request);
  const [, family, slug] = path.split("/");
  const entries: PublicEntry[] = family === "services" ? SERVICE_ENTRIES : family === "physicians" ? PHYSICIAN_ENTRIES : ARTICLE_ENTRIES;
  const catalogDetail = /^\/(services|physicians|resources)\/[^/]+$/.test(path);
  if (family === "physicians" && catalogDetail && !findPublicEntry(entries, slug)) return NextResponse.next();
  if (!catalogDetail || findPublicEntry(entries, slug)) {
    const headers = new Headers(request.headers);
    // Overwrite any caller-supplied value; the layout uses only our matched pathname.
    headers.delete("x-emcrown-content-path");
    if (path !== "/_site" && findDefinition(path)) headers.set("x-emcrown-content-path", path);
    return NextResponse.next({ request: { headers } });
  }
  // An unmatched static path reaches the root 404 without awaiting dynamic params.
  // This fixture-only guard must be replaced with CMS-aware existence checks later.
  return NextResponse.rewrite(new URL("/404", request.url), { status: 404 });
}
export const config = { matcher: ["/((?!_next|media|emcrown-admin|favicon.ico|robots.txt|sitemap.xml).*)", "/emcrown-admin/:path*"] };
