// Server/shared catalog lookup validates route identifiers against internal fixtures.
import type { PublicEntry } from "@/types/public";
export function findPublicEntry<T extends PublicEntry>(entries: T[], slug: string): T | undefined {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return undefined;
  return entries.find((entry) => entry.slug === slug);
}
