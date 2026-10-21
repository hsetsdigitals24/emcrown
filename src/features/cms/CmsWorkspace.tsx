// Client workspace: load editors on demand and synchronize page navigation without storing drafts locally.
"use client";
import { useRef, useState } from "react";
import dynamic from "next/dynamic";
import { CMS_COPY } from "@/config/cms/copy";
import { findDefinition } from "@/config/cms/registry";
import { cmsRequest } from "@/features/cms/client-api";
import type { CmsRevision, CmsSnapshot, CmsValues } from "@/types/cms";
import { useWorkspaceHeaderHeight } from "@/features/cms/useWorkspaceHeaderHeight";
const Editor = dynamic(() => import("@/features/cms/Editor"), { ssr: false, loading: () => <p role="status">{CMS_COPY.loading}</p> });
export default function CmsWorkspace({ initial, initialRevisions, initialContext = {}, siteValues, canPublish }: {
  initial: CmsSnapshot; initialRevisions: CmsRevision[]; initialContext?: Record<string, CmsValues>; siteValues: CmsValues; canPublish: boolean;
}) {
  const [snapshot, setSnapshot] = useState(initial);
  const ref = useRef<HTMLElement>(null);
  useWorkspaceHeaderHeight(ref);
  const [revisions, setRevisions] = useState(initialRevisions);
  const [context, setContext] = useState<Record<string, CmsValues>>({ ...initialContext, [initial.path]: initial.values, "/_site": siteValues });
  const [generation, setGeneration] = useState(0);
  const [error, setError] = useState("");
  const [browse, setBrowse] = useState(false);
  const [tab, setTab] = useState("edit");
  const [previewWidth, setPreviewWidth] = useState<number | null>(null);
  async function navigate(path: string) {
    setError("");
    const result = await cmsRequest(path);
    if (!result.ok) { setError(CMS_COPY.error); return; }
    setSnapshot(result.snapshot); setRevisions(result.revisions);
    setContext(current => ({ ...current, ...result.context, [path]: result.snapshot.values }));
    setGeneration(value => value + 1);
  }
  return <section ref={ref} className="cms-workspace" aria-label={CMS_COPY.title}>
    {error && <p className="cms-error" role="alert">{error}</p>}
    <Editor key={`${snapshot.path}:${generation}`} definition={findDefinition(snapshot.path)!} snapshot={snapshot} revisions={revisions}
      siteValues={context["/_site"]} canPublish={canPublish} context={context} onNavigate={navigate}
      browse={browse} onBrowseChange={setBrowse} tab={tab} onTabChange={setTab}
      previewWidth={previewWidth} onWidthChange={setPreviewWidth}
      onSaved={value => setContext(current => ({ ...current, [value.path]: value.values }))}
      onRestore={(value, history) => { setSnapshot(value); setRevisions(history); setGeneration(current => current + 1); }} />
  </section>;
}
