// Client preview transport: accept messages only from our own authenticated frame and origin.
"use client";
import { useCallback, useEffect, useRef } from "react";
import { z } from "zod";
import { pathSchema } from "@/features/cms/validation";
import { CMS_COPY } from "@/config/cms/copy";
import type { CmsValues } from "@/types/cms";
import PreviewControls from "@/features/cms/PreviewControls";
import { usePreviewViewport } from "@/features/cms/usePreviewViewport";
const messageSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("cms:ready") }),
  z.object({ type: z.literal("cms:navigate"), path: pathSchema }),
  z.object({ type: z.literal("cms:select"), field: z.string().max(200) }),
]);
export default function PreviewFrame({ path, values, siteValues, context, browse, onSelect, onNavigate, width, onWidthChange }: {
  path: string; values: CmsValues; siteValues: CmsValues; context: Record<string, CmsValues>; browse: boolean;
  onSelect: (field: string) => void; onNavigate: (path: string) => void;
  width: number | null; onWidthChange: (width: number | null) => void;
}) {
  const ref = useRef<HTMLIFrameElement>(null);
  const { ref: stageRef, available, frameWidth, scale, displayWidth } = usePreviewViewport(width);
  const send = useCallback(() => ref.current?.contentWindow?.postMessage({ type: "cms:render", path, values, siteValues, context, browse }, window.location.origin), [path, values, siteValues, context, browse]);
  useEffect(() => { send(); }, [send]);
  useEffect(() => {
    function receive(event: MessageEvent<unknown>) {
      if (event.origin !== window.location.origin || event.source !== ref.current?.contentWindow) return;
      const message = messageSchema.safeParse(event.data);
      if (!message.success) return;
      if (message.data.type === "cms:ready") send();
      if (message.data.type === "cms:select") onSelect(message.data.field);
      if (message.data.type === "cms:navigate") onNavigate(message.data.path);
    }
    window.addEventListener("message", receive);
    return () => window.removeEventListener("message", receive);
  }, [send, onSelect, onNavigate]);
  return <><PreviewControls width={width} available={available} scale={scale} onChange={onWidthChange} />
    <div className="cms-preview-stage" ref={stageRef}><div className="cms-preview-window" style={{ width: displayWidth }}>
      <iframe ref={ref} title={CMS_COPY.preview} className="cms-preview-frame" src="/emcrown-admin/cms/preview" onLoad={send}
        style={{ width: frameWidth, height: `${100 / scale}%`, transform: `scale(${scale})` }}
        sandbox="allow-scripts allow-same-origin" referrerPolicy="no-referrer" />
    </div></div></>;
}
