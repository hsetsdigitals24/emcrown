// Client island: hover opens native details; clicking and keyboard still toggle it.
"use client";
import type { ReactNode } from "react";
export default function GuideAnswer({ children }: { children: ReactNode }) {
  return <details onPointerEnter={(event) => {
    if (event.pointerType === "mouse") event.currentTarget.open = true;
  }}>{children}</details>;
}
