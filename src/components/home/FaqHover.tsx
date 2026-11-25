// Client island: immediate mouse hover disclosure, with native touch and keyboard controls.
"use client";
import type { ReactNode } from "react";
export default function FaqHover({ children }: { children: ReactNode }) {
  return <div className="editorial-faq-list" onPointerOver={event => {
    if (event.pointerType !== "mouse") return;
    const details = (event.target as Element).closest<HTMLDetailsElement>(".faq-item");
    if (details) details.open = true;
  }} onPointerOut={event => {
    if (event.pointerType !== "mouse") return;
    const details = (event.target as Element).closest<HTMLDetailsElement>(".faq-item");
    if (details && !(event.relatedTarget instanceof Node && details.contains(event.relatedTarget))) details.open = false;
  }}>{children}</div>;
}
