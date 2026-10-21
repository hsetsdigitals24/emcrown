// Client editor entry: Puck composition keeps its engine independent of workspace layout.
"use client";
import { useMemo } from "react";
import { Puck } from "@puckeditor/core";
import { fieldGroups, makePuckConfig, toPuckData } from "@/features/cms/puck-adapter";
import EditorPanels from "@/features/cms/EditorPanels";
import type { CmsDefinition, CmsRevision, CmsSnapshot, CmsValues } from "@/types/cms";
import "@puckeditor/core/no-external.css";
export type EditorProps = { definition: CmsDefinition; snapshot: CmsSnapshot; revisions: CmsRevision[]; siteValues: CmsValues;
  canPublish: boolean; context: Record<string, CmsValues>; onNavigate: (path: string) => Promise<void>;
  browse: boolean; onBrowseChange: (value: boolean) => void; tab: string; onTabChange: (value: string) => void;
  previewWidth: number | null; onWidthChange: (width: number | null) => void;
  onSaved: (snapshot: CmsSnapshot) => void; onRestore: (snapshot: CmsSnapshot, revisions: CmsRevision[]) => void };
export default function Editor(props: EditorProps) {
  const config = useMemo(() => makePuckConfig(props.definition), [props.definition]);
  const data = useMemo(() => toPuckData(props.definition, props.snapshot.values), [props.definition, props.snapshot.values]);
  const hero = fieldGroups(props.definition).findIndex(group => group === "hero" || group === "content.hero");
  return <Puck config={config} data={data} iframe={{ enabled: false }}
    permissions={{ insert: false, delete: false, duplicate: false, drag: false }} ui={{ itemSelector: { index: Math.max(0, hero) } }}>
    <EditorPanels {...props} />
  </Puck>;
}
