// Server component: editable headings; highlight is restricted to large text.
import type { ReactNode } from "react";
export function Heading({ children, highlightedPhrase, as: Tag = "h2", display = false, id, cmsFields }: {
  children: ReactNode; highlightedPhrase?: string; as?: "h1" | "h2" | "h3";
  display?: boolean; id?: string; cmsFields?: { headline: string; highlightedPhrase: string };
}) {
  return <Tag id={id} data-cms-field={cmsFields?.headline} className={`font-heading font-light tracking-tight text-primary ${display ? "text-display leading-display" : "text-heading leading-heading"}`}>
    {children}{highlightedPhrase && <> <span data-cms-field={cmsFields?.highlightedPhrase} className="text-highlight">{highlightedPhrase}</span></>}
  </Tag>;
}
export function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="text-eyebrow font-medium uppercase tracking-eyebrow text-textSecondary">{children}</p>;
}
export function BodyText({ children }: { children: ReactNode }) {
  return <p className="text-body leading-body text-textSecondary">{children}</p>;
}
