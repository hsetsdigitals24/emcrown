// Client island: coordinated one-shot hero entrances, preserving visible booking controls.
"use client";
import { PAGE_READY_EVENT } from "@/config/brand";
import { useEffect, useRef, type ReactNode } from "react";
export default function HeroEntrance({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = ref.current;
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    if (!root || preference.matches) return;
    const animations = new Set<Animation>();
    const play = (selector: string, frames: Keyframe[], duration: number, delay = 0, stagger = 0) => {
      root.querySelectorAll(selector).forEach((element, index) => {
        const animation = element.animate(frames, { duration, delay: delay + index * stagger, easing: "cubic-bezier(.16,1,.3,1)", fill: "backwards" });
        animations.add(animation);
        animation.onfinish = () => { animations.delete(animation); animation.cancel(); };
      });
    };
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      play(".hero-copy > .text-eyebrow", [{ opacity: 0, transform: "translateY(12px)" }, { opacity: 1, transform: "none" }], 600);
      play(".hero-word", [{ opacity: 0, transform: "translateY(110%) rotate(3deg)" }, { opacity: 1, transform: "none" }], 950, 70, 55);
      play(".hero-description", [{ opacity: 0, transform: "translateY(20px)" }, { opacity: 1, transform: "none" }], 750, 300);
      play(".hero-actions", [{ transform: "translateY(8px)" }, { transform: "none" }], 650);
      play(".hero-chip, .hero-caption", [{ opacity: 0 }, { opacity: 1 }], 800, 420);
    }, { threshold: 0.1 });
    const stop = () => { if (preference.matches) { observer.disconnect(); animations.forEach(animation => animation.cancel()); } };
    const start = () => observer.observe(root);
    // Coordinate with the existing loading screen so it cannot conceal the entrance.
    if (document.querySelector(".initial-page-loader")) window.addEventListener(PAGE_READY_EVENT, start, { once: true });
    else start();
    preference.addEventListener("change", stop);
    return () => { window.removeEventListener(PAGE_READY_EVENT, start); observer.disconnect(); animations.forEach(animation => animation.cancel()); preference.removeEventListener("change", stop); };
  }, []);
  return <div ref={ref} className="min-w-0">{children}</div>;
}
