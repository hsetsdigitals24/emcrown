// Server component: editable practice details, live address map and directions.
import PracticeMap from "@/components/ui/PracticeMap";
import Container from "@/components/layout/Container";
import BlockHeading from "@/components/home/BlockHeading";
import type { LocationContent } from "@/types/home";
export default function Location({ content }: { content: LocationContent }) {
  return <section id={content.id} aria-labelledby={`${content.id}-heading`} className="home-section location-section" data-mock={content.isMock}>
    <Container><BlockHeading content={content} /><div className="location-layout"><PracticeMap address={content.address} label={content.mapLabel} />
      <div className="location-details"><p className="text-eyebrow uppercase tracking-eyebrow">{content.detailsLabel}</p><address>{content.address}</address>
        <a className="inline-flex min-h-target items-center text-primary" href={content.phone.href}>{content.phone.label}</a><p>{content.hours}</p>
        <div className="flex flex-wrap gap-3">{content.badges.map((badge) => <span className="status-badge" key={badge}>{badge}</span>)}</div>
        <a className="inline-flex min-h-target items-center gap-3 text-primary" href={content.directions.href}>{content.directions.label}<span aria-hidden="true">↗</span></a>
      </div></div></Container>
  </section>;
}
