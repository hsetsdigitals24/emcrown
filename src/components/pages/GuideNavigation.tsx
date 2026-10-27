// Client island: track document sections with one passive, frame-batched scroll update.
"use client";
import { useEffect, useState } from "react";
type GuideLink = { id: string; label: string; number?: string };
export default function GuideNavigation({ label, links }: { label: string; links: GuideLink[] }) {
  const [active, setActive] = useState(links[0]?.id);
  useEffect(() => {
    const sections = links.map(link => document.getElementById(link.id)).filter((section): section is HTMLElement => Boolean(section));
    let frame: number | null = null;
    const update = () => {
      frame = null;
      let current = sections[0]?.id;
      for (const section of sections) {
        if (section.getBoundingClientRect().top <= 160) current = section.id;
      }
      if (innerHeight + scrollY >= document.documentElement.scrollHeight - 2) current = sections.at(-1)?.id ?? current;
      setActive(current);
    };
    const schedule = () => { if (frame === null) frame = requestAnimationFrame(update); };
    update();
    addEventListener("scroll", schedule, { passive: true });
    addEventListener("resize", schedule);
    return () => {
      removeEventListener("scroll", schedule);
      removeEventListener("resize", schedule);
      if (frame !== null) cancelAnimationFrame(frame);
    };
  }, [links]);
  return <nav aria-label={label}><p className="eyebrow">{label}</p>{links.map(link => <a key={link.id} href={`#${link.id}`} aria-current={active === link.id ? "location" : undefined} onClick={() => setActive(link.id)}>{link.number && <span>{link.number}</span>}{link.label}</a>)}</nav>;
}
