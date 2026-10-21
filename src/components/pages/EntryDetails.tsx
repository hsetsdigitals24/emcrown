// Server component: detail metadata for approved biographies and article review slots.
import type { ArticleEntry, PhysicianEntry } from "@/types/public";
import Container from "@/components/layout/Container";
import Button from "@/components/ui/Button";
import { CATALOG_COPY } from "@/config/pages/information";
export function PhysicianDetails({ entry, copy = CATALOG_COPY }: { entry: PhysicianEntry; copy?: typeof CATALOG_COPY }) {
  return <Container><div className="entry-details"><dl className="metadata-grid">
    <div><dt>{entry.labels.specialty}</dt><dd>{entry.specialty}</dd></div>
    <div><dt>{entry.labels.credentials}</dt><dd>{entry.credentials}</dd></div>
    <div><dt>{entry.labels.languages}</dt><dd>{entry.languages.join(", ")}</dd></div>
  </dl><Button purpose="primary" href={copy.biographyBookingLink}>{copy.biographyBooking}</Button></div></Container>;
}
export function ArticleDetails({ entry }: { entry: ArticleEntry }) {
  return <Container><dl className="entry-details metadata-grid">
    <div><dt>{entry.labels.category}</dt><dd>{entry.category}</dd></div>
    <div><dt>{entry.labels.author}</dt><dd>{entry.author}</dd></div>
    <div><dt>{entry.labels.publishedDate}</dt><dd>{entry.publishedDate}</dd></div>
    <div><dt>{entry.labels.reviewDate}</dt><dd>{entry.reviewDate}</dd></div>
  </dl></Container>;
}
