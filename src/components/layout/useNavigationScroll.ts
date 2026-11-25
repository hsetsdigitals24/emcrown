// Client hook: schedule scroll updates and prevent header flicker near the threshold.
"use client";
import { useEffect, type RefObject } from "react";
export function useNavigationScroll(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const shell = ref.current;
      if (!shell) return;
      const wasScrolled = shell.dataset.scrolled === "true";
      const scrolled = window.scrollY > (wasScrolled ? 24 : 72);
      shell.dataset.scrolled = String(scrolled);
      // The departing contact strip must also leave the keyboard tab order.
      const strip = shell.querySelector<HTMLElement>(".reference-contactbar");
      if (strip) strip.inert = scrolled && window.matchMedia("(min-width: 80rem)").matches;
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [ref]);
}
