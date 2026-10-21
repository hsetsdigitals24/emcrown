// Client component: disclosure enhancement with Escape and outside-click dismissal.
"use client";
import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
function closeDisclosures(element: HTMLElement, restoreFocus = false) {
  element.querySelectorAll<HTMLDetailsElement>("details[open]").forEach((details) => {
    details.open = false;
    if (restoreFocus) details.querySelector<HTMLElement>("summary")?.focus();
  });
}
export default function NavigationShadow({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const update = () => { if (ref.current) ref.current.dataset.scrolled = String(window.scrollY > 40); };
    const dismiss = (event: PointerEvent) => {
      if (ref.current && event.target instanceof Node && !ref.current.contains(event.target)) closeDisclosures(ref.current);
    };
    const mobile = ref.current?.querySelector<HTMLDetailsElement>(".navigation-mobile");
    // Embedded CMS previews have an outer admin main; never inert the menu's own ancestor.
    const layout = ref.current?.closest("[data-site-layout]");
    const targets = [...layout?.querySelectorAll<HTMLElement>("[data-site-main], footer") ?? []];
    const syncMenu = () => {
      const opened = Boolean(mobile?.open && innerWidth < 1280);
      targets.forEach((element) => { element.inert = opened; });
      mobile?.querySelector("summary")?.setAttribute("aria-expanded", String(opened));
    };
    const resize = () => { if (innerWidth >= 1280 && mobile) mobile.open = false; syncMenu(); };
    mobile?.addEventListener("toggle", syncMenu);
    window.addEventListener("resize", resize);
    update();
    window.addEventListener("scroll", update, { passive: true });
    document.addEventListener("pointerdown", dismiss);
    return () => { window.removeEventListener("scroll", update); document.removeEventListener("pointerdown", dismiss); mobile?.removeEventListener("toggle", syncMenu); window.removeEventListener("resize", resize); targets.forEach((element) => { element.inert = false; }); };
  }, []);
  return <div ref={ref} className="navigation-shell" onKeyDown={(event) => {
    if (event.key === "Tab" && ref.current?.querySelector<HTMLDetailsElement>(".navigation-mobile")?.open) {
      const elements = [...ref.current.querySelectorAll<HTMLElement>("a, summary, button")].filter((element) => element.getClientRects().length > 0 && !element.closest("details:not([open]) > :not(summary)"));
      const first = elements[0];
      const last = elements.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
    if (event.key === "Escape" && ref.current) closeDisclosures(ref.current, true);
  }} onClick={(event) => {
    if (event.target instanceof Element && (event.target.closest("a") || event.target.closest(".menu-backdrop")) && ref.current) closeDisclosures(ref.current);
  }} onFocusCapture={(event) => {
    const details = event.target.closest<HTMLDetailsElement>(".navigation-disclosure");
    if (details && ref.current && !details.open) { closeDisclosures(ref.current); details.open = true; }
  }} onBlurCapture={(event) => {
    if (ref.current && !ref.current.contains(event.relatedTarget)) closeDisclosures(ref.current);
  }} onPointerOver={(event) => {
    if (event.pointerType !== "mouse") return;
    const details = (event.target as HTMLElement).closest<HTMLDetailsElement>(".navigation-disclosure");
    if (details && ref.current && !details.open) { closeDisclosures(ref.current); details.open = true; }
  }} onPointerOut={(event) => {
    const details = (event.target as HTMLElement).closest<HTMLDetailsElement>(".navigation-disclosure");
    if (details && !details.contains(event.relatedTarget as Node | null) && !details.contains(document.activeElement)) details.open = false;
  }}>{children}</div>;
}
