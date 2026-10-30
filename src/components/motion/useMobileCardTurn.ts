// Client hook: reveal the text face once per mobile viewport entry without taking focus.
"use client";
import { useEffect, type RefObject } from "react";
export function useMobileCardTurn(ref: RefObject<HTMLDivElement | null>, setOpen: (open: boolean) => void) {
  useEffect(() => {
    const card = ref.current;
    if (!card) return;
    const mobile = matchMedia("(max-width: 1023px) and (hover: none), (max-width: 1023px) and (pointer: coarse)");
    let observer: IntersectionObserver | undefined;
    const observe = () => {
      observer?.disconnect();
      if (!mobile.matches) return;
      let entered = false;
      observer = new IntersectionObserver(([entry]) => {
        if (entry.intersectionRatio >= 0.55 && !entered) {
          entered = true;
          card.closest(".service-entry")?.getAnimations().forEach(animation => animation.finish());
          setOpen(true);
        } else if (entry.intersectionRatio < 0.1 && entered) {
          entered = false;
          setOpen(false);
        }
      }, { rootMargin: "-80px 0px -72px 0px", threshold: [0, 0.1, 0.55] });
      observer.observe(card);
    };
    const change = () => { setOpen(false); observe(); };
    observe();
    mobile.addEventListener("change", change);
    return () => { observer?.disconnect(); mobile.removeEventListener("change", change); };
  }, [ref, setOpen]);
}
