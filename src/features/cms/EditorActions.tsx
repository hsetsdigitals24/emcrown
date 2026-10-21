// Client controls: publishing actions and local undo/redo stay distinct from saved revisions.
"use client";
import { createUsePuck } from "@puckeditor/core";
import { CMS_COPY } from "@/config/cms/copy";
import type { CmsConfig } from "@/features/cms/puck-adapter";
import type { CmsOperation } from "@/types/cms";
const useCmsPuck = createUsePuck<CmsConfig>();
export default function EditorActions({ busy, canPublish, published, site, onAction }: {
  busy: boolean; canPublish: boolean; published: boolean; site: boolean; onAction: (operation: CmsOperation) => void;
}) {
  const history = useCmsPuck(state => state.history);
  return <div className="cms-actions" aria-busy={busy}>
    <button type="button" onClick={history.back} disabled={busy || !history.hasPast}>{CMS_COPY.undo}</button>
    <button type="button" onClick={history.forward} disabled={busy || !history.hasFuture}>{CMS_COPY.redo}</button>
    <button type="button" onClick={() => onAction("save")} disabled={busy}>{CMS_COPY.save}</button>
    {canPublish && <button className="cms-primary" type="button" onClick={() => onAction("publish")} disabled={busy}>{CMS_COPY.publish}</button>}
    {canPublish && published && !site && <button type="button" onClick={() => onAction("unpublish")} disabled={busy}>{CMS_COPY.unpublish}</button>}
  </div>;
}
