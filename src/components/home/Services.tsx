// Server component: editable service cards inside a small motion island.
import Container from "@/components/layout/Container";

import ServiceCardsMotion from "@/components/motion/ServiceCardsMotion";
import BlockHeading from "@/components/home/BlockHeading";
import GuideCard from "@/components/pages/GuideCard";
import type { HomeBlock } from "@/types/home";
export default function Services({ content }: { content: HomeBlock }) {
  return <section id={content.id} aria-labelledby={`${content.id}-heading`} className="home-section" data-mock={content.isMock}>
    <Container><BlockHeading content={content} /><ServiceCardsMotion itemCount={content.items.length}>{content.items.map((item) =>
      <article key={item.id} data-cms-id={item.id} className="service-entry">
        <GuideCard title={item.title} description={item.description} category={item.tags?.[0]} href={item.link?.href ?? "/services"} action={item.link?.label ?? ""} image={item.image?.src ?? "/media/hero-care.jpg"} imageLabel={item.image?.label ?? ""} />
      </article>,
    )}</ServiceCardsMotion></Container>
  </section>;
}
