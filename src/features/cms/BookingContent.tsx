// Shared booking presentation: editorial data stays separate from scheduling and contact state.
import { CLINICAL_COPY } from "@/config/clinical";
import Container from "@/components/layout/Container";
import { Eyebrow, Heading, BodyText } from "@/components/ui/Typography";
import BookingForm from "@/features/booking/BookingForm";
import { BOOKING_SETTINGS } from "@/config/booking";
import { BOOKING_SEED, SITE_SEED } from "@/config/cms/content";
import type { MockSchedule } from "@/types/booking";
export default function BookingContent({ content, site, schedule, initialProviderId, selectionUnavailable = false }: { content: typeof BOOKING_SEED; site: typeof SITE_SEED; schedule: MockSchedule; initialProviderId?: string; selectionUnavailable?: boolean }) {
  const { copy } = content;
  const locations = site.practice.locations.slice(0, 1);
  return <section className="booking-page" aria-labelledby="book-heading"><Container>
    <div className="booking-page-intro"><Eyebrow>{copy.title}</Eyebrow><Heading as="h1" id="book-heading" highlightedPhrase={copy.highlightedPhrase}
      cmsFields={{ headline: "copy.headline", highlightedPhrase: "copy.highlightedPhrase" }}>{copy.headline}</Heading><BodyText>{copy.introduction}</BodyText></div>
    <aside className="booking-demo-notice" aria-labelledby="booking-demo-title"><h2 id="booking-demo-title">{copy.demoTitle}</h2><p>{copy.demoNotice}</p></aside>
    <noscript><p className="booking-demo-notice">{copy.noScript} <a href={site.practice.phone.href}>{site.practice.phone.label}</a></p></noscript>
    {selectionUnavailable && <p role="status" className="booking-demo-notice">{CLINICAL_COPY.unavailablePhysician}</p>}
    <BookingForm key={initialProviderId ?? "default"} settings={{ ...BOOKING_SETTINGS, initialProviderId, types: content.appointmentTypes, providers: content.providers, locationIds: locations.map(location => location.id), defaultLocationId: locations[0].id }} schedule={schedule} locations={locations} copy={copy} />
  </Container></section>;
}
