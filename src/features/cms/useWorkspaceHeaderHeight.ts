// Client hook: keep mobile editor tabs below the actual wrapped workspace header.
"use client";
import { useEffect, type RefObject } from "react";
export function useWorkspaceHeaderHeight(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const header = document.querySelector(".workspace-header");
    if (!header) return;
    const update = () => ref.current?.style.setProperty("--cms-header-height", `${header.getBoundingClientRect().height}px`);
    const observer = new ResizeObserver(update);
    observer.observe(header); update();
    return () => observer.disconnect();
  }, [ref]);
}
