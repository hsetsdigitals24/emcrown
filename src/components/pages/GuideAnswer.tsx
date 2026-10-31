// Client island: reversible answer fades with native details fallback and keyboard/touch controls.
"use client";
import { useEffect, useRef, type ReactNode } from "react";
export default function GuideAnswer({ children }: { children: ReactNode }) {
  const animation = useRef<Animation | null>(null);
  const closing = useRef(false);
  useEffect(() => () => animation.current?.cancel(), []);

  function showAnswer(details: HTMLDetailsElement, open: boolean) {
    if (open === details.open && !closing.current) return;
    const body = details.querySelector<HTMLElement>(".guide-answer-body");
    const current = body && details.open ? getComputedStyle(body) : null;
    const from = { opacity: current?.opacity ?? "0", transform: current?.transform ?? "translateY(8px)" };
    animation.current?.cancel();
    closing.current = !open;
    if (!body || matchMedia("(prefers-reduced-motion: reduce)").matches) {
      details.open = open;
      closing.current = false;
      return;
    }
    if (open) details.open = true;
    // Keep native content available until its exit fade finishes; never animate layout dimensions.
    const next = body.animate([from, { opacity: open ? "1" : "0", transform: open ? "translateY(0)" : "translateY(-4px)" }],
      { duration: open ? 280 : 180, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "forwards" });
    animation.current = next;
    void next.finished.then(() => {
      if (animation.current !== next) return;
      if (!open) details.open = false;
      closing.current = false;
      next.cancel();
      animation.current = null;
    }).catch(() => {});
  }

  return <details onPointerEnter={event => {
    if (event.pointerType === "mouse") showAnswer(event.currentTarget, true);
  }} onPointerLeave={event => {
    if (event.pointerType === "mouse" && !event.currentTarget.querySelector(":focus-visible")) showAnswer(event.currentTarget, false);
  }} onBlur={event => {
    if (!event.currentTarget.contains(event.relatedTarget) && !event.currentTarget.matches(":hover")) showAnswer(event.currentTarget, false);
  }} onClick={event => {
    if (!(event.target instanceof Element) || !event.target.closest("summary")) return;
    event.preventDefault();
    showAnswer(event.currentTarget, closing.current || !event.currentTarget.open);
  }}>{children}</details>;
}
