// Server public profiles: only explicitly published fields; private contacts and CVs are never rendered.
import Reveal from "@/components/motion/Reveal";
import Button from "@/components/ui/Button";
import { physicianName } from "@/lib/physician-name";
import Image from "next/image";
import Link from "next/link";
import Container from "@/components/layout/Container";
import type { PublicPhysician } from "@/types/clinical";
import { CLINICAL_COPY as c } from "@/config/clinical";
export function PublicPhysicianList({ records }: { records: PublicPhysician[] }) {
  return <section className="home-section"><Container><h1 className="text-4xl text-primary">{c.physicians}</h1><p>{c.publicPhysicianIntro}</p>
    <div className="clinical-profile-grid">{records.map(record => <article key={record.id} className="clinical-panel">
      {record.photo && <Image src={record.photo} alt={record.fullName} width={320} height={320} unoptimized referrerPolicy="no-referrer" />}
      <h2>{physicianName(record)}</h2><p>{record.specialties}</p><Link className="clinical-button" href={`/physicians/${record.slug}`}>{c.profile}</Link>
    </article>)}</div></Container></section>;
}
export function PublicPhysicianDetail({ record }: { record: PublicPhysician }) {
  const name = physicianName(record);
  const details = [[c.credentials, record.credentials], [c.specialties, record.specialties], [c.languages, record.languages]].filter(([, value]) => value);
  return <article className="physician-profile"><Container>
    <Link href="/physicians" className="physician-back">{c.allPhysicians}</Link>
    <div className="physician-profile-hero">
      <Reveal className="physician-profile-portrait" duration={800}>
        {record.photo ? <Image src={record.photo} alt={name} width={600} height={720} unoptimized referrerPolicy="no-referrer" /> : <div className="physician-portrait-placeholder">{c.photoPlaceholder}</div>}
      </Reveal>
      <Reveal className="physician-profile-intro" delay={120} duration={700}>
        <p className="text-eyebrow uppercase tracking-eyebrow">{c.physicians}</p>
        <h1>{name}</h1>{record.specialties && <p className="physician-specialties">{record.specialties}</p>}
        <Button href={`/book?physician=${encodeURIComponent(record.slug)}`} purpose="primary">{c.book}</Button>
        <nav className="physician-profile-jumps" aria-label={c.profileExplore}>
          {record.bio && <a href="#physician-about">{c.profileAbout}</a>}
          {details.map(([label], index) => <a key={label} href={`#physician-detail-${index}`}>{label}</a>)}
        </nav>
      </Reveal>
    </div>
    <div className="physician-profile-body">
      {record.bio && <Reveal><section id="physician-about" className="physician-about"><p className="text-eyebrow uppercase tracking-eyebrow">{c.profileAbout}</p><h2>{name}</h2><p className="whitespace-pre-line">{record.bio}</p></section></Reveal>}
      {details.length > 0 && <Reveal stagger className="physician-profile-facts">{details.map(([label, value], index) => <details open key={label} id={`physician-detail-${index}`}><summary>{label}<span aria-hidden="true">+</span></summary><p className="whitespace-pre-line">{value}</p></details>)}</Reveal>}
    </div>
  </Container></article>;
}
