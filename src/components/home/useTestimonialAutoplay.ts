// Client hook: rotate only while visible, with hover/focus, tab visibility and motion safeguards.
"use client";
import { useEffect, useRef } from "react";
import type { RefObject } from "react";
export function useTestimonialAutoplay(container: RefObject<HTMLDivElement | null>, advance: () => void, active: number, delay: number, enabled: boolean, paused: boolean) {
  const callback = useRef(advance);
  useEffect(() => { callback.current = advance; }, [advance]);
  useEffect(() => {
    const element = container.current;
    if (!element || !enabled || paused) return;
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    let disposed = false;
    let visible = false;
    let hovering = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const update = () => {
      clearTimeout(timer);
      if (disposed) return;
      if (visible && !hovering && !element.contains(document.activeElement) && !document.hidden && !preference.matches) timer = setTimeout(() => callback.current(), delay);
    };
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting && entry.intersectionRatio >= 0.3; update(); }, { threshold: [0, 0.3] });
    const enter = () => { hovering = true; update(); };
    const leave = () => { hovering = false; update(); };
    const blur = () => { queueMicrotask(update); };
    observer.observe(element);
    element.addEventListener("pointerenter", enter); element.addEventListener("pointerleave", leave);
    element.addEventListener("focusin", update); element.addEventListener("focusout", blur);
    document.addEventListener("visibilitychange", update); preference.addEventListener("change", update);
    return () => {
      disposed = true; clearTimeout(timer); observer.disconnect();
      element.removeEventListener("pointerenter", enter); element.removeEventListener("pointerleave", leave);
      element.removeEventListener("focusin", update); element.removeEventListener("focusout", blur);
      document.removeEventListener("visibilitychange", update); preference.removeEventListener("change", update);
    };
  }, [container, active, delay, enabled, paused]);
}
