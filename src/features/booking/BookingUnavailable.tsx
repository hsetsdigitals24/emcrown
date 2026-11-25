// Server component: a practical contact path while live booking is unavailable.
import Container from "@/components/layout/Container";
import Button from "@/components/ui/Button";
import { Eyebrow, Heading } from "@/components/ui/Typography";
import type { BOOKING_SEED, SITE_SEED } from "@/config/cms/content";
export default function BookingUnavailable({ content, site }: { content: typeof BOOKING_SEED; site: typeof SITE_SEED }) {
  const copy = content.copy;
  const location = site.practice.locations[0];
  return <section className="booking-page" aria-labelledby="book-heading"><Container>
    <div className="booking-page-intro"><Eyebrow>{copy.title}</Eyebrow>
      <Heading as="h1" id="book-heading" highlightedPhrase={copy.highlightedPhrase}>{copy.headline}</Heading></div>
    <div className="booking-form-card booking-unavailable">
      <h2>{copy.unavailableTitle}</h2><p>{copy.unavailableBody}</p>
      <div className="editorial-actions"><Button purpose="primary" href={site.practice.phone.href}>{site.practice.phone.label}</Button>
        <Button href="/contact">{copy.contactLabel}</Button></div>
      <address>{location.address}</address><p>{location.hours}</p>
    </div>
  </Container></section>;
}
