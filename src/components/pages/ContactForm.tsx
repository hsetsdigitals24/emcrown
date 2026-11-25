// Server component: a usable contact action while online enquiries are unavailable.
import Button from "@/components/ui/Button";
import { CONTACT_COPY as DEFAULT_COPY } from "@/config/pages/contact";
import { PRACTICE } from "@/config/practice";
import type { ContentLink } from "@/types/content";
export default function ContactForm({ copy = DEFAULT_COPY, phone = PRACTICE.phone }: { copy?: typeof DEFAULT_COPY; phone?: ContentLink } = {}) {
  return <section aria-labelledby="contact-form-heading" className="contact-form-panel">
    <h2 id="contact-form-heading" className="font-heading text-heading font-light text-primary">{copy.formHeading}</h2>
    <p className="my-4 text-textSecondary">{copy.formUnavailable}</p>
    <Button href={phone.href} purpose="primary">{copy.phone}</Button>
  </section>;
}
