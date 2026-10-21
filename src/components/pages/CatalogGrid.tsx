// Server component: reusable typed service, physician, resource and policy cards.
import Link from "next/link";
import Card from "@/components/ui/Card";
import ServiceCardsMotion from "@/components/motion/ServiceCardsMotion";
import Reveal from "@/components/motion/Reveal";
import PhotoPlaceholder from "@/components/home/PhotoPlaceholder";
import type { PublicEntry } from "@/types/public";
export default function CatalogGrid({ entries, actionLabel, images = false, portraits = false, serviceMotion = false }: {
  entries: PublicEntry[]; actionLabel: string; images?: boolean; portraits?: boolean; serviceMotion?: boolean;
}) {
  const cards = entries.map((entry, index) => <article id={entry.slug} key={entry.slug} className={serviceMotion ? "service-entry" : undefined}>
    {serviceMotion ? <div className={`service-surface ${index % 2 ? "service-surface-tint" : ""}`}><CatalogCard entry={entry} actionLabel={actionLabel} images={images} portraits={portraits} /></div> : <Card interactive><CatalogCard entry={entry} actionLabel={actionLabel} images={images} portraits={portraits} /></Card>}
  </article>);
  return serviceMotion ? <ServiceCardsMotion itemCount={entries.length}>{cards}</ServiceCardsMotion> : <Reveal stagger className="services-grid">{cards}</Reveal>;
}
function CatalogCard({ entry, actionLabel, images, portraits }: { entry: PublicEntry; actionLabel: string; images: boolean; portraits: boolean }) {
  return <div className="catalog-card">
      {images && entry.photoLabel && <div className={portraits ? "" : "catalog-image"}><PhotoPlaceholder label={entry.photoLabel} /></div>}
      <span className="service-tag">{entry.category}</span>
      <h2 className="font-heading text-2xl font-light text-primary"><Link href={entry.path}>{entry.title}</Link></h2>
      <p className="text-textSecondary">{entry.hero.body}</p>
      <Link className="inline-flex min-h-target items-center gap-3 text-primary" href={entry.path}>{actionLabel}<span aria-hidden="true">↗</span></Link>
    </div>;
}
