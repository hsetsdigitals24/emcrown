// Client island: stagger visible appointment cards from the right; content stays server-rendered.
"use client";
import { useEffect, useRef } from "react";
import type { ReactNode } from "react";

export default function BookingCardsMotion({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLOListElement>(null);
  useEffect(() => {
    const list = ref.current;
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    if (!list || preference.matches || !("IntersectionObserver" in window)) return;
    const cards = Array.from(list.children);
    const animations = new Set<Animation>();
    const observer = new IntersectionObserver(entries => {
      const visible = entries.filter(entry => entry.isIntersecting)
        .sort((a, b) => cards.indexOf(a.target) - cards.indexOf(b.target));
      visible.forEach((entry, index) => {
        observer.unobserve(entry.target);
        if (preference.matches) return;
        // Measure the resting card, so even wide screens start at the viewport's right edge.
        const distance = Math.max(80, innerWidth - entry.target.getBoundingClientRect().left);
        const animation = entry.target.animate([
          { opacity: 0, transform: `translateX(${distance}px) scale(0.65)` },
          { opacity: 1, transform: "translateX(0) scale(1)" },
        ], { duration: 900, delay: index * 180, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "backwards" });
        animations.add(animation);
        animation.onfinish = () => { animations.delete(animation); animation.cancel(); };
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -4% 0px" });
    cards.forEach(card => observer.observe(card));
    const stop = () => {
      if (!preference.matches) return;
      observer.disconnect();
      animations.forEach(animation => animation.cancel());
    };
    preference.addEventListener("change", stop);
    return () => {
      observer.disconnect();
      animations.forEach(animation => animation.cancel());
      preference.removeEventListener("change", stop);
    };
  }, [children]);
  return <ol ref={ref} className="booking-steps">{children}</ol>;
}
