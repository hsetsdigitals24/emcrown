// Server component: published physician information and shared practice contact details.
import Image from "next/image";
import Link from "next/link";
import Container from "@/components/layout/Container";
import Reveal from "@/components/motion/Reveal";
import Button from "@/components/ui/Button";
import PhysicianVisit from "@/features/physicians/PhysicianVisit";
import { CLINICAL_COPY as copy } from "@/config/clinical";
import { SITE_SEED } from "@/config/cms/content";
import { physicianName } from "@/lib/physician-name";
import type { PublicPhysician } from "@/types/clinical";
export default function PhysicianProfile({ record, site = SITE_SEED }: { record: PublicPhysician; site?: typeof SITE_SEED }) {
  const name = physicianName(record);
  const facts = [
    { id: "credentials", label: copy.credentials, value: record.credentials },
    { id: "specialties", label: copy.specialties, value: record.specialties },
    { id: "languages", label: copy.languages, value: record.languages },
  ].filter(fact => fact.value.trim());
  return <article className="profile-page"><Container>
    <Link href="/physicians" className="profile-back"><span aria-hidden="true">←</span>{copy.allPhysicians}</Link>
    <div className={`profile-layout ${record.photo ? "" : "profile-layout-text"}`}>
      {record.photo && <aside className="profile-portrait-column">
        <Reveal duration={550}><figure className="profile-portrait">
          <Image src={record.photo} alt={name} width={480} height={600} loading="eager" unoptimized referrerPolicy="no-referrer" />
        </figure></Reveal>
        <p className="profile-practice-name">{site.footer.practiceName}</p>
      </aside>}
      <div className="profile-content">
        <header className="profile-introduction">
          <p className="text-eyebrow uppercase tracking-eyebrow">{copy.profileHeading}</p>
          <h1>{name}</h1>
          {record.specialties && <p className="profile-specialty">{record.specialties}</p>}
          <div className="profile-primary-action">{record.bookingAvailable ?
            <Button href={`/book?physician=${encodeURIComponent(record.slug)}`} purpose="primary">{copy.book}<span aria-hidden="true">↗</span></Button> :
            <p className="profile-booking-status" role="status">{copy.bookingPaused}</p>}
          </div>
        </header>
        <nav className="profile-navigation" aria-label={copy.profileExplore}>
          {record.bio.trim() && <a href="#physician-about">{copy.profileAbout}</a>}
          {facts.map(fact => <a key={fact.id} href={`#physician-${fact.id}`}>{fact.label}</a>)}
          <a href="#physician-visit">{copy.profileVisit}</a>
        </nav>
        {record.bio.trim() && <section id="physician-about" className="profile-biography" aria-labelledby="profile-about-heading">
          <h2 id="profile-about-heading">{copy.profileAbout}</h2>
          <p>{record.bio}</p>
        </section>}
        {facts.length > 0 && <div className="profile-facts">{facts.map(fact => <details key={fact.id} id={`physician-${fact.id}`} open>
          <summary>{fact.label}<span aria-hidden="true">+</span></summary><p>{fact.value}</p>
        </details>)}</div>}
        <PhysicianVisit site={site} />
      </div>
    </div>
  </Container></article>;
}
