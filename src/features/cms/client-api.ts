// Client transport: validate server responses before they enter editor state.
import { z } from "zod";
import { valuesSchema, validateValues } from "@/features/cms/validation";
import type { CmsResult } from "@/types/cms";
const resultSchema = z.discriminatedUnion("ok", [
  z.object({ ok: z.literal(true), snapshot: z.object({ path: z.string(), values: valuesSchema, version: z.number().int().nonnegative(), published: z.boolean() }),
    revisions: z.array(z.object({ id: z.uuid(), action: z.enum(["initial", "save", "publish", "unpublish", "restore"]), createdAt: z.iso.datetime() })).max(30), context: z.record(z.string(), valuesSchema).optional() }),
  z.object({ ok: z.literal(false), code: z.enum(["conflict", "invalid", "unavailable", "denied"]) }),
]);
export async function cmsRequest(path: string, input?: unknown): Promise<CmsResult> {
  try {
    const response = await fetch(`/emcrown-admin/cms/api?path=${encodeURIComponent(path)}`, input ? {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input),
    } : { cache: "no-store" });
    const parsed = resultSchema.safeParse(await response.json());
    if (!parsed.success || (parsed.data.ok && (parsed.data.snapshot.path !== path || !validateValues(path, parsed.data.snapshot.values)))) return { ok: false, code: "unavailable" };
    return parsed.data;
  } catch { return { ok: false, code: "unavailable" }; }
}
