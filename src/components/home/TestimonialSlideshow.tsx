// Client island: manual slide navigation with reduced-motion-aware transitions.
"use client";
import { Children, useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { ReactNode } from "react";
import type { TestimonialsContent } from "@/types/home";
const subscribe = () => () => {};
export default function TestimonialSlideshow({ children, controls }: { children: ReactNode; controls: TestimonialsContent["controls"] }) {
  const slides = Children.toArray(children);
  const ready = useSyncExternalStore(subscribe, () => true, () => false);
  const [active, setActive] = useState(0);
  const [focused, setFocused] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const refs = useRef<Array<HTMLDivElement | null>>([]);
  const busy = useRef(false);
  const animations = useRef<Animation[]>([]);
  useEffect(() => {
    animations.current.forEach((animation) => animation.cancel());
    refs.current.forEach((element) => element?.style.removeProperty("visibility"));
    busy.current = false;
    return () => animations.current.forEach((animation) => animation.cancel());
  }, [active]);
  async function select(next: number) {
    if (busy.current || next === active || !slides.length) return;
    const target = (next + slides.length) % slides.length;
    const outgoing = refs.current[active];
    const incoming = refs.current[target];
    if (!outgoing || !incoming) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) { setActive(target); return; }
    busy.current = true;
    const direction = next > active ? 1 : -1;
    incoming.style.visibility = "visible";
    const options = { duration: 650, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "forwards" as const };
    const exit = outgoing.animate([{ opacity: 1, transform: "translateX(0)" }, { opacity: 0, transform: `translateX(${-direction * 64}px)` }], options);
    const enter = incoming.animate([{ opacity: 0, transform: `translateX(${direction * 64}px)` }, { opacity: 1, transform: "translateX(0)" }], options);
    animations.current = [exit, enter];
    await Promise.allSettled([exit.finished, enter.finished]);
    setActive(target);
  }
  return <div ref={container} onFocusCapture={() => setFocused(true)} onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }} className="testimonial-slideshow" data-enhanced={ready} role="region" aria-roledescription={controls.roleDescription} aria-label={controls.label}>
    <div className="testimonial-stage">{slides.map((slide, index) => <div key={index} ref={(element) => { refs.current[index] = element; }} className="testimonial-slide" data-active={index === active} aria-hidden={ready && index !== active} inert={ready && index !== active}>{slide}</div>)}</div>
    {slides.length > 1 && <div className="testimonial-controls">
      <button type="button" disabled={!ready} aria-label={controls.previous} onClick={() => void select(active - 1)}>←</button>
      <div className="testimonial-dots">{slides.map((_, index) => <button key={index} type="button" disabled={!ready} aria-label={`${controls.goTo} ${index + 1}`} aria-current={index === active ? "true" : undefined} onClick={() => void select(index)}><span /></button>)}</div>
      <button type="button" disabled={!ready} aria-label={controls.next} onClick={() => void select(active + 1)}>→</button>
    </div>}
    <p className="sr-only" aria-live={focused ? "polite" : "off"} aria-atomic="true">{controls.slide} {active + 1} {controls.of} {slides.length}</p>
  </div>;
}
