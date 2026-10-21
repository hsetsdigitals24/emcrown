// Client-safe hit testing: map visible text/images back to allowlisted editorial fields.
import type { CmsDefinition, CmsField, CmsValues } from "@/types/cms";
const normalize = (text: string) => text.replace(/\s+/g, " ").trim();
function closestField(target: Element, fields: CmsField[]) {
  let element: Element | null = target;
  while (element) {
    const owner = element.getAttribute("data-cms-id") ?? element.id;
    const match = fields.find(field => field.owners.includes(owner));
    if (match) return match;
    element = element.parentElement;
  }
  return fields[0];
}
export function fieldAtElement(target: Element, definition: CmsDefinition, values: CmsValues) {
  const explicit = target.closest<HTMLElement>("[data-cms-field]")?.dataset.cmsField;
  if (explicit && definition.fields.some(field => field.key === explicit)) return explicit;
  const image = target.closest("img,video") ?? target.querySelector("img,video");
  if (image) {
    const sources = [image.getAttribute("src"), image.getAttribute("poster")].filter((value): value is string => Boolean(value));
    for (const source of sources) {
      let path: string;
      try { const url = new URL(source, "http://preview.local"); path = url.searchParams.get("url") ?? url.pathname; }
      catch { continue; }
      const field = closestField(target, definition.fields.filter(field => field.media && values[field.key] === path));
      if (field) return field.key;
    }
  }
  let element: Element | null = target;
  for (let depth = 0; element && depth < 5; depth++, element = element.parentElement) {
    const text = normalize(element.textContent ?? "");
    if (!text || text.length > 22000) continue;
    const matches = definition.fields.filter(field => !field.media && !field.link && normalize(values[field.key] ?? "") === text);
    const scope = element.closest<HTMLElement>("[data-cms-group]")?.dataset.cmsGroup;
    const field = matches.find(field => field.group === scope) ?? closestField(target, matches);
    if (field) return field.key;
  }
  return undefined;
}
