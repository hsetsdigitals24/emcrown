// Server-only encrypted CV objects: separate private bucket, no public image adapter access.
import "server-only";
import { z } from "zod";
import { storageEnv } from "@/lib/storage";
const bucketSchema = z.string().regex(/^[a-z0-9][a-z0-9-]{0,62}$/);
export async function cvObject(path: string, method: "GET" | "POST" | "DELETE", bytes?: Buffer) {
  const env = storageEnv(); const bucket = bucketSchema.parse(process.env.SUPABASE_CV_BUCKET);
  if (!/^[a-f0-9-]{36}\/[a-f0-9-]{36}\.enc$/.test(path)) throw new Error("Invalid document path.");
  const headers = { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}` };
  const options = { cache: "no-store" as const, redirect: "error" as const, signal: AbortSignal.timeout(15000) };
  if (method === "POST") {
    const bucketResult = await fetch(`${env.SUPABASE_URL}/storage/v1/bucket/${bucket}`, { ...options, headers });
    if (!bucketResult.ok || !z.object({ public: z.literal(false) }).safeParse(await bucketResult.json()).success) throw new Error("Private CV bucket required.");
  }
  const result = await fetch(`${env.SUPABASE_URL}/storage/v1/object/${method === "GET" ? "authenticated/" : ""}${bucket}/${path}`, {
    ...options, method, headers: { ...headers, "Content-Type": "application/octet-stream", "x-upsert": "false" }, body: bytes ? new Uint8Array(bytes) : undefined,
  });
  if (!result.ok) throw new Error("Document storage unavailable.");
  return result;
}
