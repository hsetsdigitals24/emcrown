// Server private download: no document names in URLs, no shared caching or inline document execution.
import { downloadDocument } from "@/features/physicians/documents";
import { readSessionToken } from "@/features/auth/session";
import { allowAttempt } from "@/features/auth/rate-limit";
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const headers = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff", "Content-Security-Policy": "default-src 'none'; sandbox", "Content-Disposition": "attachment; filename=physician-cv" };
  try {
    const token = await readSessionToken();
    if (!token || !await allowAttempt("clinical:download", token, 30)) return new Response(null, { status: 403, headers });
    const result = await downloadDocument((await params).id);
    return result ? new Response(new Uint8Array(result.bytes), { headers: { ...headers, "Content-Type": result.type } }) : new Response(null, { status: 404, headers });
  } catch { return new Response(null, { status: 503, headers }); }
}
