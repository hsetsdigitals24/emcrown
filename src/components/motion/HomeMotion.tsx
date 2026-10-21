// Client component: defer the scroll library while keeping all content server-rendered.
"use client";
import dynamic from "next/dynamic";
import { useRef } from "react";
import type { ReactNode } from "react";
const ScrollEffects = dynamic(() => import("@/components/motion/ScrollEffects"), { ssr: false });
export default function HomeMotion({ children }: { children: ReactNode }) {
  const scope = useRef<HTMLDivElement>(null);
  return <div ref={scope} className="min-w-0"><ScrollEffects scope={scope} />{children}</div>;
}
