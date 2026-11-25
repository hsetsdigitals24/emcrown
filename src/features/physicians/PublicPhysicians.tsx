// Server public profiles: only explicitly published fields; private contacts and CVs are never rendered.
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
            <div className="editorial-physician-actions"><Link className="physician-directory-link" href={`/physicians/${record.slug}`}>{site.catalog.physicianLink}<span aria-hidden="true">↗</span></Link>
              {record.bookingAvailable && <Button href={`/book?physician=${encodeURIComponent(record.slug)}`}>{c.book}</Button>}</div>
          </div>
        </article>;
      })}</div>
    </Container></section>
  </PageFrame>;
}
export { default as PublicPhysicianDetail } from "@/features/physicians/PhysicianProfile";
