// Server-only public reads: drafts never reach public routes or shared caches.
import "server-only";
import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";
import { cmsDocuments, organisations } from "@/lib/db/schema";
import { authConfigured } from "@/lib/auth-env";
import { applyContent } from "@/features/cms/fields";
import { storedValues } from "@/features/cms/validation";
// Version the cache when editorial field shapes change; old snapshots must not linger.
// Cache only published snapshots. Nonce CSP requires Cache Components to remain disabled.
const cachedPublication = unstable_cache(async (path: string) => {
  const [row] = await db().select({ published: cmsDocuments.published, withdrawn: cmsDocuments.withdrawn }).from(cmsDocuments)
    .innerJoin(organisations, eq(organisations.id, cmsDocuments.organisationId))
    .where(and(eq(organisations.key, "emcrown"), eq(cmsDocuments.path, path))).limit(1);
  return row ?? null;
}, ["cms-public-v3"], { tags: ["cms:public"], revalidate: 3600 });
export const publicValues = cache(async (path: string) => {
  if (!authConfigured()) return undefined;
  const row = await cachedPublication(path);
  if (!row) return undefined;
  return row.withdrawn ? null : row.published ? storedValues(path, row.published) : undefined;
});
export async function publishedContent<T>(path: string, seed: T): Promise<T> {
  const values = await publicValues(path);
  // Unpublishing is explicit. A never-published saved draft preserves the starter site.
  if (values === null && path !== "/_site") notFound();
  return values ? applyContent(seed, values) : seed;
}
