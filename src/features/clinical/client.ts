// Client-safe transport: validate response contracts and keep sensitive input out of URLs/logs.
import { z } from "zod";
import type { ClinicalResult } from "@/types/clinical";
const envelope = z.discriminatedUnion("ok", [z.object({ ok: z.literal(true), data: z.unknown() }), z.object({ ok: z.literal(false), code: z.enum(["invalid", "denied", "conflict", "unavailable"]) })]);
export async function clinicalRequest<T>(url: string, schema: z.ZodType<T>, input?: unknown): Promise<ClinicalResult<T>> {
  try {
    const response = await fetch(url, input === undefined ? { cache: "no-store" } : {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input),
    });
    const parsed = envelope.safeParse(await response.json());
    if (!parsed.success) return { ok: false, code: "unavailable" };
    if (!parsed.data.ok) return parsed.data;
    const data = schema.safeParse(parsed.data.data);
    return data.success ? { ok: true, data: data.data } : { ok: false, code: "unavailable" };
  } catch { return { ok: false, code: "unavailable" }; }
}
