// Server media route: draft assets require MFA; public assets must be referenced by published content.
import { z } from "zod";
import { readMedia, mediaBytes } from "@/features/cms/media";
import { allowAttempt } from "@/features/auth/rate-limit";
const filenameSchema = z.string().regex(/^[a-f0-9-]{36}\.(jpg|png|webp)$/).refine(value => z.uuid().safeParse(value.split(".")[0]).success);
export async function GET(_request: Request, { params }: { params: Promise<{ filename: string }> }) {
  const parsed = filenameSchema.safeParse((await params).filename);
  const headers = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff", "Content-Security-Policy": "default-src 'none'; sandbox", "X-Robots-Tag": "noindex" };
  if (!parsed.success) return new Response(null, { status: 404, headers });
  try {
    if (!await allowAttempt("cms:media", "public", 30000)) return new Response(null, { status: 429, headers });
    const media = await readMedia(parsed.data.split(".")[0], `/media/cms/${parsed.data}`);
    if (!media) return new Response(null, { status: 404, headers });
    return new Response(new Uint8Array(await mediaBytes(media)), { headers: { ...headers, "Content-Type": media.contentType } });
  } catch { return new Response(null, { status: 503, headers }); }
}
