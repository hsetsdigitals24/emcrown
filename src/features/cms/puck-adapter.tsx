// Client-safe Puck configuration: one selectable component per existing content section.
import type { Config, Data } from "@puckeditor/core";
import FieldInput from "@/features/cms/FieldInput";
import { humanize } from "@/features/cms/fields";
import type { CmsDefinition, CmsValues } from "@/types/cms";
export type CmsComponents = Record<string, Record<string, string>>;
export type CmsConfig = Config<{ components: CmsComponents }>;
export type CmsData = Data<CmsComponents>;
export function fieldGroups(definition: CmsDefinition) { return [...new Set(definition.fields.map(field => field.group))]; }
export function makePuckConfig(definition: CmsDefinition): CmsConfig {
  return { components: Object.fromEntries(fieldGroups(definition).map((group, index) => [`section${index}`, {
    label: humanize(group.replaceAll(".", " / ")),
    fields: Object.fromEntries(definition.fields.flatMap((field, fieldIndex) => field.group !== group ? [] : [[`f${fieldIndex}`, {
      type: "custom" as const, label: field.label,
      render: ({ value, onChange }: { value: string; onChange: (value: string) => void }) => <FieldInput field={field} value={value} onChange={onChange} />,
    }]])), render: () => <></>,
  }])) };
}
export function toPuckData(definition: CmsDefinition, values: CmsValues): CmsData {
  return { root: { props: {} }, content: fieldGroups(definition).map((group, index) => ({
    type: `section${index}`, props: { id: `section${index}`, ...Object.fromEntries(definition.fields.flatMap((field, fieldIndex) => field.group !== group ? [] : [[`f${fieldIndex}`, values[field.key] ?? ""]])) },
  })) };
}
export function fromPuckData(definition: CmsDefinition, data: CmsData): CmsValues {
  const values = { ...definition.initial };
  for (const item of data.content) definition.fields.forEach((field, index) => { if (typeof item.props[`f${index}`] === "string") values[field.key] = item.props[`f${index}`]; });
  return values;
}
