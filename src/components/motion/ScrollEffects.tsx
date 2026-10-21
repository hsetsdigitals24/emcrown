// Client component: scoped desktop ScrollTriggers revert on unmount or reduced motion.
"use client";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { animateHero } from "@/components/motion/hero-scroll";
import type { RefObject } from "react";

gsap.registerPlugin(ScrollTrigger, useGSAP);
function pinPrinciples(root: HTMLElement) {
  const panel = root.querySelector(".principles-panel");
  const items = root.querySelectorAll(".principle-item");
  if (!panel || !items.length) return;
  // Keep a clear reading interval between each scroll-driven focus transition.
  gsap.set(items, { opacity: 0.4, scale: 0.9, y: 18, transformOrigin: "left center" });
  gsap.set(items[0], { opacity: 1, scale: 1, y: 0 });
  const timeline = gsap.timeline({ scrollTrigger: { trigger: panel, start: "top 112px", end: "+=720", pin: true, scrub: 0.65, invalidateOnRefresh: true } });
  timeline.to({}, { duration: 0.6 });
  items.forEach((item, index) => {
    if (index === 0) return;
    const position = timeline.duration();
    timeline.to(items[index - 1], { opacity: 0.4, scale: 0.9, y: -10, duration: 0.7, ease: "power2.inOut" }, position);
    timeline.to(item, { opacity: 1, scale: 1, y: 0, duration: 0.9, ease: "power2.out" }, position);
    timeline.to({}, { duration: 0.6 });
  });
}
function animateSteps(root: HTMLElement) {
  root.querySelectorAll(".booking-step").forEach((step) => {
    const badge = step.querySelector(".step-number");
    if (!badge) return;
    gsap.fromTo(badge, { scale: 1, opacity: 0.65 }, { scale: 1.15, opacity: 1, ease: "none",
      scrollTrigger: { trigger: step, start: "top 70%", end: "top 35%", scrub: 0.4, invalidateOnRefresh: true },
    });
    gsap.fromTo(step, { y: 12 }, { y: 0, ease: "none", scrollTrigger: { trigger: step, start: "top 85%", end: "top 45%", scrub: 0.5 } });
  });
}
export default function ScrollEffects({ scope }: { scope: RefObject<HTMLDivElement | null> }) {
  useGSAP(() => {
    const root = scope.current;
    if (!root) return;
    const media = gsap.matchMedia();
    media.add("(min-width: 1024px) and (prefers-reduced-motion: no-preference)", () => {
      const cleanupHero = animateHero(root);
      animateSteps(root);
      return cleanupHero;
    });
    // Pinning must fit below navigation instead of covering content on short screens.
    media.add("(min-width: 1024px) and (min-height: 800px) and (prefers-reduced-motion: no-preference)", () => pinPrinciples(root));
    return () => media.revert();
  }, { scope });
  return null;
}
