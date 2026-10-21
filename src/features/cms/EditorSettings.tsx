// Client settings: select sections, find fields and focus exact preview selections.
"use client";
import { Puck, createUsePuck } from "@puckeditor/core";
import { useEffect, useRef, useState } from "react";
import { fieldGroups, type CmsConfig } from "@/features/cms/puck-adapter";
import { humanize } from "@/features/cms/fields";
import { CMS_COPY } from "@/config/cms/copy";
import type { CmsDefinition } from "@/types/cms";
const useCmsPuck = createUsePuck<CmsConfig>();
export default function EditorSettings({ definition, selected, selectionCount, onSelect, busy }: {
  definition: CmsDefinition; selected: string; selectionCount: number; onSelect: (field: string) => void; busy: boolean;
}) {
  const dispatch = useCmsPuck(state => state.dispatch);
  const index = useCmsPuck(state => state.appState.ui.itemSelector?.index ?? 0);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLFieldSetElement>(null);
  const groups = fieldGroups(definition);
  useEffect(() => {
    if (!selected) return;
    const frame = requestAnimationFrame(() => {
      const element = Array.from(ref.current?.querySelectorAll<HTMLElement>("[data-cms-input]") ?? []).find(item => item.dataset.cmsInput === selected);
      element?.scrollIntoView({ block: "center", behavior: "instant" });
      element?.querySelector<HTMLElement>("input,textarea")?.focus({ preventScroll: true });
      ref.current?.querySelectorAll(".cms-field-selected").forEach(item => item.classList.remove("cms-field-selected"));
      element?.classList.add("cms-field-selected");
    });
    return () => cancelAnimationFrame(frame);
  }, [selected, index, selectionCount]);
  return <fieldset ref={ref} disabled={busy} className="cms-settings-fields"><legend className="sr-only">{CMS_COPY.settings}</legend>
    <label className="cms-control">{CMS_COPY.section}<select value={index} onChange={event => dispatch({ type: "setUi", ui: { itemSelector: { index: Number(event.target.value) } } })}>
      {groups.map((group, position) => <option key={group} value={position}>{humanize(group.replaceAll(".", " / "))}</option>)}</select></label>
    <label className="cms-control">{CMS_COPY.search}<input type="search" value={query} onChange={event => setQuery(event.target.value)} /></label>
    {query && <div className="cms-search-results">{definition.fields.filter(field => field.label.toLowerCase().includes(query.toLowerCase())).slice(0, 20).map(field =>
      <button key={field.key} type="button" onClick={() => { setQuery(""); onSelect(field.key); }}>{field.label}</button>)}</div>}
    <Puck.Fields />
  </fieldset>;
}
