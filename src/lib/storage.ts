// Server-only private Supabase Storage transport; credentials never reach the browser.
import "server-only";
import { z } from "zod";
const schema = z.object({
  SUPABASE_URL: z.url().refine(value => new URL(value).protocol === "https:" && new URL(value).pathname === "/"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),
  SUPABASE_STORAGE_BUCKET: z.string().regex(/^[a-z0-9][a-z0-9-]{0,62}$/),
});
export function storageEnv() {
  const result = schema.safeParse(process.env);
  if (!result.success) throw new Error("Configure SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and SUPABASE_STORAGE_BUCKET for CMS uploads.");
  return result.data;
}
async function storageRequest(path: string, method: "GET" | "POST" | "DELETE", bytes?: Buffer) {
  const env = storageEnv();
  if (!/^[a-f0-9-]{36}\/[a-f0-9-]{36}\.webp$/.test(path)) throw new Error("Invalid storage path.");
  const prefix = method === "GET" ? "object/authenticated" : "object";
  const response = await fetch(`${env.SUPABASE_URL.replace(/\/$/, "")}/storage/v1/${prefix}/${env.SUPABASE_STORAGE_BUCKET}/${path}`, {
    method, headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      ...(bytes ? { "Content-Type": "image/webp", "x-upsert": "false" } : {}) },
    body: bytes ? new Uint8Array(bytes) : undefined, cache: "no-store", redirect: "error", signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error("CMS image storage request failed.");
  return response;
}
export async function storeImage(path: string, bytes: Buffer) {
  if (!/^[a-f0-9-]{36}\/[a-f0-9-]{36}\.webp$/.test(path)) throw new Error("Invalid storage path.");
  const env = storageEnv();
  // A public bucket would bypass draft privacy even though our own route checks access.
  const response = await fetch(`${env.SUPABASE_URL.replace(/\/$/, "")}/storage/v1/bucket/${env.SUPABASE_STORAGE_BUCKET}`, {
    headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}` },
    cache: "no-store", redirect: "error", signal: AbortSignal.timeout(15000),
  });
  const bucket = z.object({ public: z.literal(false) }).safeParse(response.ok ? await response.json() : null);
  if (!bucket.success) throw new Error("CMS Storage requires an existing private bucket.");
  await storageRequest(path, "POST", bytes);
}
export async function deleteImage(path: string) { await storageRequest(path, "DELETE"); }
export async function loadImage(path: string) {
  const response = await storageRequest(path, "GET");
  return Buffer.from(await response.arrayBuffer());
}
