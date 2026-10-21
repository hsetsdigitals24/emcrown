// Server upload endpoint: same-origin, MFA, permission and rate-limit checks on every upload.
import { readSessionToken } from "@/features/auth/session";
import { validateRequest } from "@/features/auth/request";
import { uploadMedia } from "@/features/cms/media";
import { cmsJson, boundedBody } from "@/features/cms/http";
import { CMS_POLICY } from "@/config/cms/copy";
export async function POST(request: Request) {
  const token = await readSessionToken();
  if (!token) return cmsJson({ ok: false }, 401);
  try {
    if (!await validateRequest("cms:upload", token, 30)) return cmsJson({ ok: false }, 403);
    const url = await uploadMedia(await boundedBody(request, CMS_POLICY.maxImageBytes));
    return url ? cmsJson({ url }) : cmsJson({ ok: false }, 400);
  } catch { return cmsJson({ ok: false }, 400); }
}
