// Server component: published physician profiles and CMS-managed homepage actions.
import Button from "@/components/ui/Button";
import Image from "next/image";
import Container from "@/components/layout/Container";
import BlockHeading from "@/components/home/BlockHeading";
import FeatureIcon from "@/components/home/FeatureIcon";
import Link from "next/link";
import type { PhysicianContent } from "@/types/home";
export default function Physicians({ content, unavailable = false }: { content: PhysicianContent; unavailable?: boolean }) {
  if (unavailable) return <section id={content.id} aria-labelledby={`${content.id}-heading`} className="home-section">
    <Container><BlockHeading content={content} centered cmsPrefix="physicians" /><p className="reference-centered" data-cms-field="physicians.labels.unavailable">{content.labels.unavailable}</p><div className="reference-actions reference-centered"><Button href={content.labels.contact.href} cmsField="physicians.labels.contact.label">{content.labels.contact.label}</Button></div></Container>
  </section>;
  return <section id={content.id} aria-labelledby={`${content.id}-heading`} className="home-section" data-mock={content.isMock}>
    <Container><BlockHeading content={content} centered cmsPrefix="physicians" /><div className="physicians-grid">{content.physicians.map((physician) => <article className="physician-card" key={physician.id} data-cms-id={physician.id}>
      {physician.photo ? <Image src={physician.photo} alt={physician.name} width={360} height={360} unoptimized referrerPolicy="no-referrer" /> : <div className="reference-physician-avatar" aria-hidden="true"><FeatureIcon kind="person" /></div>}<h3 className="font-heading text-2xl font-light text-primary">{physician.name}</h3>{physician.specialty && <p>{physician.specialty}</p>}
      <div className="editorial-physician-actions"><Link href={physician.link.href} data-cms-field="physicians.labels.profile" className="inline-flex min-h-target items-center gap-3 text-primary">{physician.link.label}<span aria-hidden="true">↗</span></Link>{physician.booking && <Button href={physician.booking.href} cmsField="physicians.labels.book">{physician.booking.label}</Button>}</div>
    </article>)}</div>{content.buttonLabel && <div className="reference-actions reference-centered" data-cms-field="physicians.buttonLabel"><Button purpose="primary" href={content.buttonLink}>{content.buttonLabel}<span aria-hidden="true">›</span></Button></div>}</Container>
  </section>;
}
