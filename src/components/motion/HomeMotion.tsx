// Client island: short one-shot reveals preserve normal scrolling and server-visible content.
"use client";
import type { ReactNode } from "react";
import Reveal from "@/components/motion/Reveal";
export default function HomeMotion({ children }: { children: ReactNode }) {
  return <Reveal className="home-motion" selector=".reference-hero-copy > h1, .reference-hero-copy > p, .home-section .block-heading, .reference-features > *, .reference-about-photo, .physician-card, .location-details, .reference-insurance-documents" distance={32} duration={750} interval={100} easing="cubic-bezier(.16, 1, .3, 1)">{children}</Reveal>;
}
