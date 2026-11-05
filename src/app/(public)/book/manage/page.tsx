// Server page: bearer management UI exposes no patient data in server HTML or metadata.
import type { Metadata } from "next";
import ManageBooking from "@/features/appointments/ManageBooking";
import "@/features/clinical/styles.css";
import Container from "@/components/layout/Container";
import { BodyText, Eyebrow, Heading } from "@/components/ui/Typography";
import { MANAGE_COPY as copy } from "@/config/manage-booking";
export const metadata: Metadata = { title: "Manage appointment | Emcrown", description: "Manage an existing appointment securely.", robots: { index: false, follow: false }, alternates: { canonical: "/book/manage" }, openGraph: { title: "Manage appointment", description: "Secure appointment management." } };
export default function Page() {
  return <section className="booking-page manage-page"><Container>
    <div className="booking-page-intro"><Eyebrow>{copy.eyebrow}</Eyebrow><Heading as="h1" highlightedPhrase={copy.highlight}>{copy.headline}</Heading><BodyText>{copy.intro}</BodyText></div>
    <ManageBooking />
    <noscript><p>{copy.noScript} <a href="/contact">{copy.contact}</a></p></noscript>
  </Container></section>;
}
