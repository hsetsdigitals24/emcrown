// Server component: editable service cards inside a small motion island.
import Container from "@/components/layout/Container";

import ServiceCardsMotion from "@/components/motion/ServiceCardsMotion";
import BlockHeading from "@/components/home/BlockHeading";
import Link from "next/link";
import type { HomeBlock } from "@/types/home";
export default function Services({ content }: { content: HomeBlock }) {
  return <section id={content.id} aria-labelledby={`${content.id}-heading`} className="home-section" data-mock={content.isMock}>
    <Container><BlockHeading content={content} /><ServiceCardsMotion itemCount={content.items.length}>{content.items.map((item, index) =>
      <article key={item.id} data-cms-id={item.id} className="service-entry"><div className={`service-surface ${index % 2 ? "service-surface-tint" : ""}`}><div className="service-card">
        <svg aria-hidden="true" className="service-icon" viewBox="0 0 40 40" fill="none"><path d="M20 6v28M6 20h28" stroke="currentColor" strokeWidth="1.5" /><circle cx="20" cy="20" r="15" stroke="currentColor" strokeWidth="1.5" /></svg>
        <h3 className="font-heading text-2xl font-light text-primary">{item.title}</h3>
        <div>{item.tags?.map((tag) => <span className="service-tag" key={tag}>{tag}</span>)}</div><p>{item.description}</p>
        {item.link && <Link className="inline-flex min-h-target items-center gap-3 text-primary" href={item.link.href}>{item.link.label}<span aria-hidden="true">↗</span></Link>}
      </div></div></article>,
    )}</ServiceCardsMotion></Container>
  </section>;
}
