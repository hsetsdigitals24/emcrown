// Client composition: synchronize Puck fields, preview, revision controls and mobile tabs.
"use client";
import { useConfirmation } from "@/components/ui/useConfirmation";
import { useToast } from "@/components/ui/ToastProvider";
import { useAutosave } from "@/features/cms/useAutosave";
import { createUsePuck } from "@puckeditor/core";
import { useCallback, useRef, useState } from "react";
import { CMS_DEFINITIONS } from "@/config/cms/registry";
import { CMS_COPY } from "@/config/cms/copy";
import { cmsRequest } from "@/features/cms/client-api";
import { fieldGroups, fromPuckData, type CmsConfig } from "@/features/cms/puck-adapter";
import { useUnsavedChanges } from "@/features/cms/useUnsavedChanges";
import EditorActions from "@/features/cms/EditorActions";
import EditorSettings from "@/features/cms/EditorSettings";
import PreviewFrame from "@/features/cms/PreviewFrame";
import RevisionHistory from "@/features/cms/RevisionHistory";
import type { EditorProps } from "@/features/cms/Editor";
import type { CmsOperation } from "@/types/cms";
const useCmsPuck = createUsePuck<CmsConfig>();
export default function EditorPanels(props: EditorProps) {
  const { definition, canPublish, onNavigate, onSaved, onRestore, browse, onBrowseChange, tab, onTabChange } = props;
  const notify = useToast();
  const { confirm, confirmation } = useConfirmation();
  const data = useCmsPuck(state => state.appState.data);
  const dispatch = useCmsPuck(state => state.dispatch);
  const values = fromPuckData(definition, data);
  const [snapshot, setSnapshot] = useState(props.snapshot);
  const [revisions, setRevisions] = useState(props.revisions);
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);
  const [message, setMessage] = useState("");
  const [selected, setSelected] = useState("");
  const [selectionCount, setSelectionCount] = useState(0);
  // PostgreSQL JSONB may reorder keys, so compare field values rather than serialization.
  const dirty = definition.fields.some(field => values[field.key] !== snapshot.values[field.key]);
  const failed = [CMS_COPY.conflict, CMS_COPY.invalid, CMS_COPY.error, CMS_COPY.denied].some(value => value === message);
  const status = busy ? CMS_COPY.busy : failed ? message : dirty ? CMS_COPY.dirty : message || (snapshot.version ? CMS_COPY.saved : CMS_COPY.seed);
  useUnsavedChanges(dirty);
  useAutosave({ content: JSON.stringify(values), dirty, busy,
    blocked: message === CMS_COPY.conflict || message === CMS_COPY.invalid || message === CMS_COPY.denied,
    retry: message === CMS_COPY.error, save: () => mutate("save", undefined, true) });
  const select = useCallback((field: string) => {
    const target = definition.fields.find(item => item.key === field);
    if (!target || inFlight.current) return;
    dispatch({ type: "setUi", ui: { itemSelector: { index: fieldGroups(definition).indexOf(target.group) } } });
    setSelected(field); setSelectionCount(count => count + 1); onTabChange("edit");
  }, [definition, dispatch, setSelected, onTabChange, setSelectionCount]);
  const navigate = useCallback(async (path: string) => {
    if (inFlight.current || (dirty && !window.confirm(CMS_COPY.leave))) return;
    inFlight.current = true; setBusy(true);
    try { await onNavigate(path); } finally { inFlight.current = false; setBusy(false); }
  }, [dirty, onNavigate]);
  async function mutate(operation: CmsOperation, revisionId?: string, automatic = false) {
    if (inFlight.current) return;
    inFlight.current = true; setBusy(true);
    try {
      const description = operation === "publish" ? CMS_COPY.publishConfirm : operation === "unpublish" ? CMS_COPY.unpublishConfirm : operation === "restore" ? CMS_COPY.restoreConfirm : "";
      const label = operation === "unpublish" ? CMS_COPY.unpublish : operation === "restore" ? CMS_COPY.restore : CMS_COPY.publish;
      if (description && !await confirm({ title: label, description, label, intent: operation === "unpublish" ? "danger" : operation === "restore" ? "caution" : "success" })) return;
      setMessage("");
      const result = await cmsRequest(definition.path, { path: definition.path, operation, version: snapshot.version, values, revisionId });
      if (!result.ok) {
        const error = result.code === "conflict" ? CMS_COPY.conflict : result.code === "invalid" ? CMS_COPY.invalid : result.code === "denied" ? CMS_COPY.denied : CMS_COPY.error;
        setMessage(error); notify(error); return;
      }
      setSnapshot(result.snapshot); setRevisions(result.revisions); onSaved(result.snapshot);
      const feedback = operation === "publish" ? CMS_COPY.published : operation === "unpublish" ? CMS_COPY.unpublished : automatic ? CMS_COPY.autosaved : CMS_COPY.saved;
      setMessage(feedback); notify(feedback, true);
      if (operation === "restore") onRestore(result.snapshot, result.revisions);
    } finally { inFlight.current = false; setBusy(false); }
  }
  return <>
    {confirmation}
    <div className="cms-toolbar"><label className="cms-control">{CMS_COPY.page}<select value={definition.path} disabled={busy} onChange={event => void navigate(event.target.value)}>
      {CMS_DEFINITIONS.map(page => <option key={page.path} value={page.path}>{page.label}</option>)}</select></label>
      <EditorActions busy={busy} canPublish={canPublish} published={snapshot.published} site={definition.path === "/_site"} onAction={operation => void mutate(operation)} />
    </div>
    <div className="cms-save-status" role="status" aria-live="polite">{status}
      {message === CMS_COPY.conflict && <button type="button" onClick={() => void navigate(definition.path)}>{CMS_COPY.retry}</button>}</div>
    <div className="cms-mobile-tabs" role="group" aria-label={CMS_COPY.title}>
      {[['edit', CMS_COPY.settings], ['preview', CMS_COPY.preview]].map(([value, label]) => <button type="button" id={`cms-tab-${value}`} aria-controls={`cms-panel-${value}`}
        aria-pressed={tab === value} key={value} onClick={() => onTabChange(value)}>{label}</button>)}
    </div>
    <div className="cms-panels" data-tab={tab}>
      <section id="cms-panel-edit" className="cms-settings" aria-label={CMS_COPY.settings}>
        <EditorSettings definition={definition} selected={selected} selectionCount={selectionCount} onSelect={select} busy={busy} />
        <RevisionHistory revisions={revisions} busy={busy} onRestore={id => void mutate("restore", id)} />
      </section>
      <section id="cms-panel-preview" className="cms-preview" aria-label={CMS_COPY.preview}>
        <div className="cms-preview-toolbar"><span>{definition.path === "/_site" ? "/" : definition.path}</span>
          <button type="button" disabled={busy} aria-pressed={browse} onClick={() => onBrowseChange(!browse)}>{browse ? CMS_COPY.select : CMS_COPY.browse}</button></div>
        <p className="cms-preview-help">{browse ? CMS_COPY.browseHelp : CMS_COPY.editHelp}</p>
        <PreviewFrame path={definition.path} values={values} siteValues={definition.path === "/_site" ? values : props.siteValues} context={props.context}
          width={props.previewWidth} onWidthChange={props.onWidthChange}
          browse={browse} onSelect={select} onNavigate={path => void navigate(path)} />
      </section>
    </div>
  </>;
}
