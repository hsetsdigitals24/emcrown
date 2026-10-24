// Server page: existing CMS permissions and versioned persistence protect practice details.
import type { Metadata } from "next";
import { authorisedRead } from "@/features/auth/authorize";
import { AUTH_COPY, hasPermission } from "@/config/auth";
import { PRACTICE_EDITOR as copy } from "@/config/practice-editor";
import { loadCms } from "@/features/cms/repository";
import WorkspacePage from "@/features/auth/WorkspacePage";
import PracticeEditor from "@/features/cms/PracticeEditor";
import "@/features/clinical/styles.css";
export const metadata: Metadata = { title: "Practice details | Emcrown", robots: { index: false, follow: false } };
export default async function PracticePage() {
  const result = await authorisedRead("content:edit");
  if (!result.actor) return <p>{AUTH_COPY.denied}</p>;
  const site = await loadCms("/_site");
  return <WorkspacePage title={copy.title}>{site.ok
    ? <PracticeEditor initial={site.snapshot} canPublish={hasPermission(result.actor.role, "content:publish")} />
    : <p role="alert">{copy.error}</p>}</WorkspacePage>;
}
