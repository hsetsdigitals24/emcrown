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
  const fields = [[entry.labels.category, entry.category], [entry.labels.author, entry.author],
    [entry.labels.publishedDate, entry.publishedDate], [entry.labels.reviewDate, entry.reviewDate]].filter(([, value]) => value.trim());
  return <Container><dl className="entry-details metadata-grid">{fields.map(([label, value]) =>
    <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
  </dl></Container>;
}
