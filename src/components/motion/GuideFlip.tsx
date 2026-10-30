// Client island: rotate two permanently attached faces, with hover and accessible controls.
// @refresh reset
"use client";
import { useMobileCardTurn } from "@/components/motion/useMobileCardTurn";
import { useEffect, useRef, useState, type ReactNode } from "react";
export default function GuideFlip({ front, children, label, closeLabel }: { front: ReactNode; children: ReactNode; label: string; closeLabel: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const focusAfterTurn = useRef(false);
  useMobileCardTurn(ref, setOpen);
  useEffect(() => {
    if (!focusAfterTurn.current) return;
    focusAfterTurn.current = false;
    ref.current?.querySelector<HTMLElement>(open ? ".guide-back a, .guide-back button" : ".guide-turn-button")?.focus({ preventScroll: true });
  }, [open]);
  function turnTo(next: boolean, focus = false) {
    focusAfterTurn.current = focus;
    setOpen(next);
  }
  return <div ref={ref} className="guide-flip" data-open={open}
    onPointerEnter={(event) => {
      if (event.pointerType !== "mouse") return;
      event.currentTarget.closest(".service-entry")?.getAnimations().forEach(animation => animation.finish());
      turnTo(true);
    }}
    onPointerLeave={(event) => { if (event.pointerType === "mouse" && !event.currentTarget.querySelector(":focus-visible")) turnTo(false); }}
    onBlur={(event) => { if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) turnTo(false); }}
    onKeyDown={(event) => { if (event.key === "Escape") turnTo(false, true); }}>
    <div className="guide-turn">
      <div className="guide-front" aria-hidden={open}>{front}<button type="button" className="guide-turn-button" tabIndex={open ? -1 : 0} aria-expanded={open} onClick={() => turnTo(true, true)}>{label}<span aria-hidden="true"> ↻</span></button></div>
      <div className="guide-back" inert={!open}>{children}<button type="button" className="guide-close" onClick={() => turnTo(false, true)}>{closeLabel}<span aria-hidden="true"> ↶</span></button></div>
    </div>
  </div>;
}
