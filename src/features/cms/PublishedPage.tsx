// Server component: load published content and related catalog entries without leaking drafts.
import { publicPhysicians } from "@/features/physicians/repository";
import { notFound } from "next/navigation";
import PageContent from "@/features/cms/PageContent";
import { publishedContent, publicValues } from "@/features/cms/public";
import { findDefinition } from "@/config/cms/registry";
import { SERVICE_ENTRIES, PHYSICIAN_ENTRIES, ARTICLE_ENTRIES, LEGAL_ENTRIES } from "@/config/cms/content";
export default async function PublishedPage({ path }: { path: string }) {
  const definition = findDefinition(path);
  if (!definition) notFound();
  const related = path === "/services" ? SERVICE_ENTRIES : path === "/physicians" ? PHYSICIAN_ENTRIES : path === "/resources" ? ARTICLE_ENTRIES : path === "/legal" ? LEGAL_ENTRIES : [];
  const [values, siteValues, ...context] = await Promise.all([
    publishedContent(path, definition.initial), publishedContent("/_site", findDefinition("/_site")!.initial),
    ...related.map(async entry => {
      const values = await publicValues(entry.path);
      return [entry.path, values === undefined ? findDefinition(entry.path)!.initial : values] as const;
    }),
  ]);
  return <PageContent path={path} values={values} siteValues={siteValues} context={Object.fromEntries(context)} physicianRecords={path === "/" ? await publicPhysicians() : undefined} />;
}
