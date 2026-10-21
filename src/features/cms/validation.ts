// Shared validation boundary: field allowlists prevent structure, script and URL injection.
import { z } from "zod";
import { findDefinition } from "@/config/cms/registry";
import { CMS_POLICY } from "@/config/cms/copy";
import type { CmsValues } from "@/types/cms";
export const pathSchema = z.string().max(200).refine(path => Boolean(findDefinition(path)));
export const valuesSchema = z.record(z.string().max(200), z.string().max(CMS_POLICY.maxText));
export const operationSchema = z.object({
  path: pathSchema, operation: z.enum(["save", "publish", "unpublish", "restore"]),
  version: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
  values: valuesSchema.optional(), revisionId: z.uuid().optional(),
}).strict();
export function isSafeLink(value: string) {
  if (!value) return true;
  if (/[\u0000-\u0020\u007f\\]/.test(value)) return false;
  if (/^\/(?!\/)/.test(value) || /^#[\w-]*$/.test(value)) return true;
  try { return ["https:", "mailto:", "tel:"].includes(new URL(value).protocol); } catch { return false; }
}
export function validateValues(path: string, input: unknown): CmsValues | null {
  const definition = findDefinition(path);
  const parsed = valuesSchema.safeParse(input);
  if (!definition || !parsed.success || JSON.stringify(parsed.data).length > CMS_POLICY.maxDocumentBytes) return null;
  const values = parsed.data;
  if (Object.keys(values).length !== definition.fields.length) return null;
  for (const field of definition.fields) {
    const value = values[field.key];
    if (value === undefined) return null;
    if (field.media && (!/^\/media\/[\w/.-]+\.(jpe?g|png|webp)$/i.test(value) || value.split("/").some(segment => segment === "." || segment === ".."))) return null;
    if (field.link && !isSafeLink(value)) return null;
  }
  return values;
}
// Stored revisions may predate added/removed fields. Only known fields survive a schema evolution.
export function storedValues(path: string, input: unknown): CmsValues | null {
  const definition = findDefinition(path);
  const parsed = valuesSchema.safeParse(input);
  if (!definition || !parsed.success) return null;
  const known = Object.fromEntries(definition.fields.filter(field => parsed.data[field.key] !== undefined).map(field => [field.key, parsed.data[field.key]]));
  return validateValues(path, { ...definition.initial, ...known });
}
