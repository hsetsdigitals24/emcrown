// Client island: visible-card entrances and pointer lighting; all service content stays on the server.
"use client";
import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { observeServiceCards } from "@/components/motion/service-entrance";
export default function ServiceCardsMotion({ children, itemCount }: { children: ReactNode; itemCount: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const pointerFrame = useRef<number | null>(null);
  useEffect(() => {
    const grid = ref.current;
    if (!grid) return;
    const stop = observeServiceCards(grid);
    return () => { stop(); if (pointerFrame.current !== null) cancelAnimationFrame(pointerFrame.current); };
  }, [itemCount]);
  return <div ref={ref} className="services-grid services-motion" onPointerMove={(event) => {
    if (event.pointerType !== "mouse" || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const surface = (event.target as HTMLElement).closest<HTMLElement>(".service-surface");
    if (!surface) return;
    const { clientX, clientY } = event;
    if (pointerFrame.current !== null) cancelAnimationFrame(pointerFrame.current);
    pointerFrame.current = requestAnimationFrame(() => {
      const bounds = surface.getBoundingClientRect();
      surface.style.setProperty("--pointer-x", `${clientX - bounds.left}px`);
      surface.style.setProperty("--pointer-y", `${clientY - bounds.top}px`);
      pointerFrame.current = null;
    });
  }} onFocusCapture={(event) => {
    const card = (event.target as HTMLElement).closest(".service-entry");
    card?.getAnimations().forEach((animation) => animation.finish());
  }}>{children}</div>;
}
