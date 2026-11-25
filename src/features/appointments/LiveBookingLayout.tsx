// Server presentation: public booking typography and layout around the live interactive form.
import type { BookingCopy } from "@/config/booking-copy";
import type { ReactNode } from "react";
import Container from "@/components/layout/Container";
import { BodyText, Eyebrow, Heading } from "@/components/ui/Typography";
import { BOOKING_REVIEW_COPY, LIVE_BOOKING_COPY as copy } from "@/config/live-booking";

export default function LiveBookingLayout({ children, reviewMode, copy: content = copy }: { children: ReactNode; reviewMode: boolean; copy?: BookingCopy }) {
  return <section className="booking-page" aria-labelledby="book-heading"><Container>
    <div className="booking-page-intro"><Eyebrow>{content.title}</Eyebrow>
      <Heading as="h1" id="book-heading" highlightedPhrase={content.highlightedPhrase}>{content.headline}</Heading>
      <BodyText>{content.introduction}</BodyText>
    </div>
    {reviewMode && <aside className="booking-demo-notice" aria-labelledby="booking-review-title">
      <h2 id="booking-review-title">{BOOKING_REVIEW_COPY.title}</h2><p>{BOOKING_REVIEW_COPY.notice}</p>
    </aside>}
    <noscript><p className="booking-demo-notice">{content.noScript}</p></noscript>
    {children}
  </Container></section>;
}
