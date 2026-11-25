// Server component: concise clinical service highlights with CMS-managed destinations.
import Container from "@/components/layout/Container";

import BlockHeading from "@/components/home/BlockHeading";
import FeatureIcon, { type FeatureIconKind } from "@/components/home/FeatureIcon";
import Button from "@/components/ui/Button";
import type { HomeBlock } from "@/types/home";
const ICONS: FeatureIconKind[] = ["medical", "shield", "pulse"];
export default function Services({ content }: { content: HomeBlock }) {
  return <section id={content.id} aria-labelledby={`${content.id}-heading`} className="home-section services-section" data-mock={content.isMock}>
    <Container><BlockHeading content={content} centered cmsPrefix="services" /><div className="reference-features">{content.items.map((item, index) =>
      <article key={item.id} data-cms-id={item.id} className="reference-feature reference-service">
        <FeatureIcon kind={ICONS[index % ICONS.length]} /><h3>{item.title}</h3><p>{item.description}</p>
        {item.link && <Button purpose="primary" href={item.link.href} cmsField={"services.items." + index + ".link.label"}>{item.link.label}<span aria-hidden="true">›</span></Button>}
      </article>,
    )}</div>{content.buttonLabel && <div className="reference-actions reference-centered" data-cms-field="services.buttonLabel"><Button href={content.buttonLink}>{content.buttonLabel}<span aria-hidden="true">↗</span></Button></div>}</Container>
  </section>;
}
