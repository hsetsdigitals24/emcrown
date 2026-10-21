// Server-only clinical transport: bounded input, same-origin writes and PHI-free errors.
import "server-only";
import { readSessionToken } from "@/features/auth/session";
import { validateRequest } from "@/features/auth/request";
import { allowAttempt } from "@/features/auth/rate-limit";
import { boundedBody, cmsJson } from "@/features/cms/http";
export { cmsJson as clinicalJson } from "@/features/cms/http";
export async function clinicalHttp(request: Request, action: () => Promise<{ ok: boolean; code?: string; data?: unknown }>) {
  const token = await readSessionToken(); if (!token) return cmsJson({ ok: false, code: "denied" }, 401);
  try {
    const allowed = request.method === "GET" ? await allowAttempt("clinical:read", token, 240) : await validateRequest("clinical:write", token, 120);
    if (!allowed) return cmsJson({ ok: false, code: "denied" }, 403);
    const result = await action();
    return cmsJson(result, result.ok ? 200 : result.code === "conflict" ? 409 : result.code === "denied" ? 403 : 400);
  } catch (error) {
    const code = databaseCode(error);
    return cmsJson({ ok: false, code: ["23P01", "23505", "40001", "40P01"].includes(code) ? "conflict" : "unavailable" }, ["23P01", "23505", "40001", "40P01"].includes(code) ? 409 : 503);
  }
}
function databaseCode(error: unknown): string {
  if (!error || typeof error !== "object") return "";
  if ("code" in error && typeof error.code === "string") return error.code;
  return "cause" in error ? databaseCode(error.cause) : "";
}
export async function clinicalBody(request: Request) {
  return JSON.parse((await boundedBody(request, 120000)).toString("utf8")) as unknown;
}
