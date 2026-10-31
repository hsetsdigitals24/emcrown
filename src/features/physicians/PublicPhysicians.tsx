// Server public profiles: only explicitly published fields; private contacts and CVs are never rendered.
import Reveal from "@/components/motion/Reveal";
import Button from "@/components/ui/Button";
import { physicianName } from "@/lib/physician-name";
import Image from "next/image";
import Link from "next/link";
import PageFrame from "@/components/pages/PageFrame";
import type { PageContent } from "@/types/public";
import type { SITE_SEED } from "@/config/cms/content";
import Container from "@/components/layout/Container";
import type { PublicPhysician } from "@/types/clinical";
import { CLINICAL_COPY as c } from "@/config/clinical";
export function PublicPhysicianList({ records, content, site }: { records: PublicPhysician[]; content: PageContent; site: typeof SITE_SEED }) {
  return <PageFrame content={content} closing={site.closing}>
    <section className="physician-directory"><Container>
      <div className="physician-directory-grid">{records.map(record => {
        const name = physicianName(record);
        return <article key={record.id} className="physician-directory-card">
          <Link href={`/physicians/${record.slug}`} className="physician-directory-frame" aria-label={name}>
            {record.photo ? <Image src={record.photo} alt={name} width={480} height={560} unoptimized referrerPolicy="no-referrer" /> : <div className="physician-portrait-placeholder">{c.photoPlaceholder}</div>}
          </Link>
          <div className="physician-directory-copy">
            <h2><Link href={`/physicians/${record.slug}`}>{name}</Link></h2>
            {record.specialties && <p className="physician-specialties">{record.specialties}</p>}
            <Link className="physician-directory-link" href={`/physicians/${record.slug}`}>{site.catalog.physicianLink}<span aria-hidden="true">↗</span></Link>
          </div>
        </article>;
      })}</div>
    </Container></section>
  </PageFrame>;
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
        {record.bookingAvailable ? <Button href={`/book?physician=${encodeURIComponent(record.slug)}`} purpose="primary">{c.book}</Button> : <p role="status">{c.bookingPaused}</p>}
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
