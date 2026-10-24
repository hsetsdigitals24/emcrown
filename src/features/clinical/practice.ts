// Server-only operational source: published CMS settings, never drafts or cached request context.
import "server-only";
import { and, eq } from "drizzle-orm";
import { db, type AuthTransaction } from "@/lib/db";
import { cmsDocuments, organisations } from "@/lib/db/schema";
import { SITE_SEED } from "@/config/cms/content";
import { storedValues } from "@/features/cms/validation";
import { applyContent } from "@/features/cms/fields";
import { singlePractice } from "@/lib/practice";
export async function publishedPractice(transaction?: AuthTransaction) {
  const reader = transaction ?? db();
  const [row] = await reader.select({ published: cmsDocuments.published }).from(cmsDocuments)
    .innerJoin(organisations, eq(organisations.id, cmsDocuments.organisationId))
    .where(and(eq(organisations.key, "emcrown"), eq(cmsDocuments.path, "/_site"))).limit(1);
  const values = row?.published ? storedValues("/_site", row.published) : null;
  return singlePractice(values ? applyContent(SITE_SEED, values).practice : SITE_SEED.practice);
}
