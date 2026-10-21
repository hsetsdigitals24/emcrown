// Server endpoint: authenticated, rate-limited editorial reads and mutations.
import { revalidatePath, revalidateTag } from "next/cache";
import { loadCms, mutateCms } from "@/features/cms/repository";
import { pathSchema, operationSchema } from "@/features/cms/validation";
import { readSessionToken } from "@/features/auth/session";
import { validateRequest } from "@/features/auth/request";
import { allowAttempt } from "@/features/auth/rate-limit";
import { cmsJson, boundedBody } from "@/features/cms/http";
import { CMS_POLICY } from "@/config/cms/copy";
export async function GET(request: Request) {
  const token = await readSessionToken();
  if (!token) return cmsJson({ ok: false, code: "denied" }, 401);
  try {
    const path = pathSchema.safeParse(new URL(request.url).searchParams.get("path"));
    if (!path.success) return cmsJson({ ok: false, code: "invalid" }, 400);
    if (!await allowAttempt("cms:read:global", "cms", 3000) || !await allowAttempt("cms:read", token, 240)) return cmsJson({ ok: false, code: "denied" }, 429);
    const result = await loadCms(path.data);
    return cmsJson(result, result.ok ? 200 : 403);
  } catch { return cmsJson({ ok: false, code: "unavailable" }, 503); }
}
export async function POST(request: Request) {
  const token = await readSessionToken();
  if (!token) return cmsJson({ ok: false, code: "denied" }, 401);
  try {
    if (!await validateRequest("cms:write", token, 120)) return cmsJson({ ok: false, code: "denied" }, 403);
    let input: unknown;
    try { input = JSON.parse((await boundedBody(request, CMS_POLICY.maxDocumentBytes)).toString("utf8")); }
    catch { return cmsJson({ ok: false, code: "invalid" }, 400); }
    const parsed = operationSchema.safeParse(input);
    if (!parsed.success) return cmsJson({ ok: false, code: "invalid" }, 400);
    const result = await mutateCms(parsed.data);
    if (result.ok && ["publish", "unpublish"].includes(parsed.data.operation)) {
      revalidateTag("cms:public", { expire: 0 });
      revalidatePath(result.snapshot.path === "/_site" ? "/" : result.snapshot.path, result.snapshot.path === "/_site" ? "layout" : "page");
    }
    return cmsJson(result, result.ok ? 200 : result.code === "conflict" ? 409 : result.code === "denied" ? 403 : 400);
  } catch { return cmsJson({ ok: false, code: "unavailable" }, 503); }
}
