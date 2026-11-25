// Client component: progressive reveal, leaving server-rendered content visible.
"use client";
import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
export default function Reveal({ children, delay = 0, stagger = false, className = "", selector, duration = 480, interval = 80, distance = 16, easing = "ease-out" }: {
  children: ReactNode; delay?: number; stagger?: boolean; className?: string; selector?: string; duration?: number; interval?: number; distance?: number; easing?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = ref.current;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!element || preference.matches || !("IntersectionObserver" in window)) return;
    const animations: Animation[] = [];
    const targets = selector ? Array.from(element.querySelectorAll(selector)) : stagger ? Array.from(element.children) : [element];
    const observer = new IntersectionObserver((entries) => {
      entries.filter(entry => entry.isIntersecting).forEach((entry, index) => {
        animations.push(entry.target.animate(
          [{ opacity: 0, transform: `translateY(${distance}px)` }, { opacity: 1, transform: "translateY(0)" }],
          { duration, delay: Math.max(0, delay) + index * interval, easing, fill: "backwards" },
        ));
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.1 });
    const stop = () => { if (preference.matches) { observer.disconnect(); animations.forEach((animation) => animation.cancel()); } };
    targets.forEach(target => observer.observe(target));
    preference.addEventListener("change", stop);
    return () => { observer.disconnect(); animations.forEach((animation) => animation.cancel()); preference.removeEventListener("change", stop); };
  }, [delay, stagger, selector, duration, interval, distance, easing]);
  return <div ref={ref} className={`min-w-0 ${className}`}>{children}</div>;
}
