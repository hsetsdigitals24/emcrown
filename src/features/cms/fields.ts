// Shared adapter: derive stable Puck fields from typed content without changing its shape.
import type { CmsDefinition, CmsField, CmsValues } from "@/types/cms";
const IMMUTABLE = new Set(["id", "slug", "path", "status", "isMock", "canonical", "state"]);
export function humanize(value: string) {
  return value.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[_-]/g, " ").replace(/^./, c => c.toUpperCase());
}
export function defineContent(path: string, label: string, seed: unknown): CmsDefinition {
  const fields: CmsField[] = [];
  const initial: CmsValues = {};
  function walk(value: unknown, segments: string[], owners: string[] = []) {
    if (typeof value === "string") {
      const name = segments.at(-1) ?? "";
      if (IMMUTABLE.has(name)) return;
      const key = segments.join(".");
      // These displayed details come from the single practice record, not duplicate text slots.
      if (path === "/" && ["location.address", "location.hours", "location.mapLabel", "location.phone.label", "location.phone.href", "location.directions.label", "location.directions.href"].includes(key)) return;
      if (path === "/_site" && (key === "footer.address" || key.startsWith("footer.locations.") || key.startsWith("footer.hours."))) return;
      const group = segments[0] === "content" ? segments.slice(0, segments[1] === "sections" ? 3 : 2).join(".") : segments[0];
      fields.push({ key, path: segments, label: segments.map(humanize).join(" / "), group, owners,
        media: /^(photo|poster|image|src)$/.test(name) || segments.includes("images"),
        link: /^(href|buttonLink|video)$/.test(name) });
      initial[key] = value;
    } else if (Array.isArray(value)) value.forEach((entry, index) => walk(entry, [...segments, String(index)], owners));
    else if (value && typeof value === "object") {
      const nextOwners = "id" in value && typeof value.id === "string" ? [...owners, value.id] : owners;
      Object.entries(value).forEach(([key, entry]) => walk(entry, [...segments, key], nextOwners));
    }
  }
  walk(seed, []);
  return { path, label, fields, initial };
}
export function applyContent<T>(seed: T, values: CmsValues): T {
  function walk(value: unknown, path: string[]): unknown {
    if (typeof value === "string") return values[path.join(".")] ?? value;
    if (Array.isArray(value)) return value.map((entry, index) => walk(entry, [...path, String(index)]));
    if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, walk(entry, [...path, key])]));
    return value;
  }
  return walk(seed, []) as T;
}
