// Client sizing: observe the panel and scale the real iframe viewport without horizontal overflow.
"use client";
import { useEffect, useRef, useState } from "react";
import { PREVIEW_WIDTH } from "@/config/cms/viewport";
export function usePreviewViewport(width: number | null) {
  const ref = useRef<HTMLDivElement>(null);
  const [available, setAvailable] = useState<number>(PREVIEW_WIDTH.mobile);
  useEffect(() => {
    if (!ref.current) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry.contentRect.width > 0) setAvailable(entry.contentRect.width);
    });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  const frameWidth = width ?? Math.max(PREVIEW_WIDTH.min, Math.floor(available));
  const scale = Math.min(1, available / frameWidth);
  return { ref, available, frameWidth, scale, displayWidth: Math.min(available, frameWidth) };
}
