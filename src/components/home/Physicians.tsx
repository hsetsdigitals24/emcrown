// Server component: physician placeholders never imply approved names or credentials.
import { CLINICAL_COPY } from "@/config/clinical";
import Image from "next/image";
import Container from "@/components/layout/Container";
import BlockHeading from "@/components/home/BlockHeading";
import PhotoPlaceholder from "@/components/home/PhotoPlaceholder";
import Link from "next/link";
import type { PhysicianContent } from "@/types/home";
export default function Physicians({ content, unavailable = false }: { content: PhysicianContent; unavailable?: boolean }) {
  if (unavailable) return <section id={content.id} aria-labelledby={`${content.id}-heading`} className="home-section">
    <Container><BlockHeading content={content} /><p>{CLINICAL_COPY.publicProfilesUnavailable}</p><Link className="guide-anchor" href="/contact">{CLINICAL_COPY.publicProfilesContact}</Link></Container>
  </section>;
  if (!content.physicians.length) return null;
  return <section id={content.id} aria-labelledby={`${content.id}-heading`} className="home-section" data-mock={content.isMock}>
    <Container><BlockHeading content={content} /><div className="physicians-grid">{content.physicians.map((physician) => <article className="physician-card" key={physician.id} data-cms-id={physician.id}>
      {physician.photo ? <Image src={physician.photo} alt={physician.name} width={360} height={360} unoptimized referrerPolicy="no-referrer" /> : <PhotoPlaceholder label={physician.photoLabel} />}<h3 className="font-heading text-2xl font-light text-primary">{physician.name}</h3><p>{physician.specialty}</p>
      <Link href={physician.link.href} className="inline-flex min-h-target items-center gap-3 text-primary">{physician.link.label}<span aria-hidden="true">↗</span></Link>
    </article>)}</div></Container>
  </section>;
}
