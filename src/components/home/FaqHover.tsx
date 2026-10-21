// Client island: desktop hover opens native details; click, touch and keyboard remain native.
"use client";
import type { ReactNode } from "react";
export default function FaqHover({ children }: { children: ReactNode }) {
  return <div onPointerOver={(event) => {
    if (event.pointerType !== "mouse" || !matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const details = (event.target as HTMLElement).closest<HTMLDetailsElement>(".faq-item");
    if (details) details.open = true;
  }}>{children}</div>;
}
