// Server presentation: public booking typography and layout around the live interactive form.
import type { ReactNode } from "react";
import Container from "@/components/layout/Container";
import { BodyText, Eyebrow, Heading } from "@/components/ui/Typography";
import { BOOKING_REVIEW_COPY, LIVE_BOOKING_COPY as copy } from "@/config/live-booking";

export default function LiveBookingLayout({ children, reviewMode }: { children: ReactNode; reviewMode: boolean }) {
  return <section className="booking-page" aria-labelledby="book-heading"><Container>
    <div className="booking-page-intro"><Eyebrow>{copy.title}</Eyebrow>
      <Heading as="h1" id="book-heading" highlightedPhrase={copy.highlightedPhrase}>{copy.headline}</Heading>
      <BodyText>{copy.introduction}</BodyText>
    </div>
    {reviewMode && <aside className="booking-demo-notice" aria-labelledby="booking-review-title">
      <h2 id="booking-review-title">{BOOKING_REVIEW_COPY.title}</h2><p>{BOOKING_REVIEW_COPY.notice}</p>
    </aside>}
    <noscript><p className="booking-demo-notice">{copy.noScript}</p></noscript>
    {children}
  </Container></section>;
}
