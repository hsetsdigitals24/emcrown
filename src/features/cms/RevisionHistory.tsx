// Client revision picker: restoration always creates a new draft for separate publication.
"use client";
import { CMS_COPY } from "@/config/cms/copy";
import type { CmsRevision } from "@/types/cms";
export default function RevisionHistory({ revisions, busy, onRestore }: { revisions: CmsRevision[]; busy: boolean; onRestore: (id: string) => void }) {
  return <details className="cms-history"><summary>{CMS_COPY.history}</summary><p>{CMS_COPY.revisionHelp}</p>
    {revisions.length ? <ol>{revisions.map(revision => <li key={revision.id} data-revision-id={revision.id}><span>{revision.action} · <time dateTime={revision.createdAt}>
      {new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(revision.createdAt))}</time></span>
      <button type="button" disabled={busy} onClick={() => onRestore(revision.id)}>{CMS_COPY.restore}</button></li>)}</ol> : <p>{CMS_COPY.noHistory}</p>}
  </details>;
}
