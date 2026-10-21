// Server route: authorize the workspace before passing safe draft projections to the editor.
import type { Metadata } from "next";
import { authorisedRead } from "@/features/auth/authorize";
import WorkspaceShell from "@/features/auth/WorkspaceShell";
import CmsWorkspace from "@/features/cms/CmsWorkspace";
import { loadCms } from "@/features/cms/repository";
import { hasPermission, AUTH_COPY } from "@/config/auth";
import { CMS_COPY } from "@/config/cms/copy";
import "@/features/cms/styles.css";
export const metadata: Metadata = { title: "Website CMS | Emcrown", description: "Private website content editor.", robots: { index: false, follow: false } };
export default async function CmsPage() {
  const result = await authorisedRead("content:edit");
  if (!result.actor) return <p>{AUTH_COPY.denied}</p>;
  const [page, site] = await Promise.all([loadCms("/"), loadCms("/_site")]);
  return <WorkspaceShell actor={result.actor} title={CMS_COPY.title}><p className="cms-intro">{CMS_COPY.intro}</p>
    {page.ok && site.ok ? <CmsWorkspace initial={page.snapshot} initialRevisions={page.revisions} initialContext={page.context} siteValues={site.snapshot.values}
      canPublish={hasPermission(result.actor.role, "content:publish")} /> : <p role="alert">{CMS_COPY.error}</p>}
  </WorkspaceShell>;
}
