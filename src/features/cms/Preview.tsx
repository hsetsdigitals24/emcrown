// Client-only private preview: actual site components, controlled links and origin-checked updates.
"use client";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import PageContent from "@/features/cms/PageContent";
import SiteLayout from "@/components/layout/SiteLayout";
import { SITE_SEED } from "@/config/cms/content";
import { findDefinition } from "@/config/cms/registry";
import { practiceFooter } from "@/lib/practice";
import { applyContent } from "@/features/cms/fields";
import { fieldAtElement } from "@/features/cms/preview-selection";
import { isPreviewNavigationControl } from "@/features/cms/preview-interaction";
import { pathSchema, valuesSchema, validateValues } from "@/features/cms/validation";
import { CMS_COPY } from "@/config/cms/copy";
import type { PublicPhysician } from "@/types/clinical";
import type { MockSchedule } from "@/types/booking";
const renderSchema = z.object({ type: z.literal("cms:render"), path: pathSchema, values: valuesSchema, siteValues: valuesSchema,
  context: z.record(z.string().max(200), valuesSchema), browse: z.boolean() });
type PreviewState = z.infer<typeof renderSchema>;
export default function Preview({ schedule, physicianRecords }: { schedule: MockSchedule; physicianRecords: PublicPhysician[] }) {
  const [state, setState] = useState<PreviewState>();
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const receive = (event: MessageEvent<unknown>) => {
      if (event.origin !== window.location.origin || event.source !== window.parent) return;
      const parsed = renderSchema.safeParse(event.data);
      if (!parsed.success || !validateValues(parsed.data.path, parsed.data.values) || !validateValues("/_site", parsed.data.siteValues)) return;
      setState(parsed.data);
    };
    window.addEventListener("message", receive);
    window.parent.postMessage({ type: "cms:ready" }, window.location.origin);
    return () => window.removeEventListener("message", receive);
  }, []);
  useEffect(() => {
    const container = root.current;
    if (!state || !container) return;
    const definition = findDefinition(state.path)!;
    const send = (message: object) => window.parent.postMessage(message, window.location.origin);
    const click = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;
      if (isPreviewNavigationControl(event.target)) return;
      if (!state.browse) {
        event.preventDefault(); event.stopPropagation();
        const field = fieldAtElement(event.target, definition, state.values);
        if (field) send({ type: "cms:select", field });
        return;
      }
      const anchor = event.target.closest("a[href]");
      if (!anchor) return;
      const url = new URL(anchor.getAttribute("href")!, window.location.origin);
      if (url.origin === window.location.origin && url.pathname === (state.path === "/_site" ? "/" : state.path) && url.hash) return;
      event.preventDefault(); event.stopPropagation();
      if (url.origin === window.location.origin && findDefinition(url.pathname) && url.pathname !== "/_site") send({ type: "cms:navigate", path: url.pathname });
    };
    const submit = (event: Event) => { event.preventDefault(); event.stopPropagation(); };
    const hover = (event: PointerEvent) => {
      container.querySelectorAll(".cms-hit").forEach(element => element.classList.remove("cms-hit"));
      if (!state.browse && event.target instanceof Element && fieldAtElement(event.target, definition, state.values)) event.target.classList.add("cms-hit");
    };
    container.addEventListener("click", click, true); container.addEventListener("submit", submit, true); container.addEventListener("pointerover", hover);
    return () => { container.removeEventListener("click", click, true); container.removeEventListener("submit", submit, true); container.removeEventListener("pointerover", hover); };
  }, [state]);
  const site = applyContent(SITE_SEED, state?.siteValues ?? {});
  return <div ref={root} className="cms-preview-root" data-cms-mode={state?.browse ? "browse" : "edit"}>{state ? <SiteLayout navigation={site.navigation} footer={practiceFooter(site.footer, site.practice)} embedded>
    <PageContent path={state.path} values={state.values} siteValues={state.siteValues} context={state.context} schedule={schedule} physicianRecords={physicianRecords} preview />
  </SiteLayout> : <p role="status">{CMS_COPY.loading}</p>}</div>;
}
