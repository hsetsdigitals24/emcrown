// Server component: inactive form template cannot collect or submit sensitive data.
import { CONTACT_COPY as CONTACT_COPY_DEFAULT } from "@/config/pages/contact";
export default function ContactForm({ copy: CONTACT_COPY = CONTACT_COPY_DEFAULT }: { copy?: typeof CONTACT_COPY_DEFAULT } = {}) {
  return <section aria-labelledby="contact-form-heading" className="contact-form-panel">
    <h2 id="contact-form-heading" className="font-heading text-heading font-light text-primary">{CONTACT_COPY.formHeading}</h2>
    <p id="contact-form-status" className="mt-4 text-textSecondary">{CONTACT_COPY.formUnavailable}</p>
    <form aria-labelledby="contact-form-heading" aria-describedby="contact-form-status"><fieldset disabled className="contact-fields">
      <label htmlFor="contact-name">{CONTACT_COPY.name}<input id="contact-name" name="name" autoComplete="name" required /></label>
      <label htmlFor="contact-email">{CONTACT_COPY.emailField}<input id="contact-email" type="email" name="email" autoComplete="email" required /></label>
      <label htmlFor="contact-message">{CONTACT_COPY.message}<textarea id="contact-message" name="message" rows={5} maxLength={1000} aria-describedby="contact-message-hint" /></label>
      <p id="contact-message-hint" className="text-sm text-textSecondary">{CONTACT_COPY.messageHint}</p>
      <button type="submit" disabled className="min-h-target rounded-pill border border-border px-6 py-3 text-textSecondary">{CONTACT_COPY.submit}</button>
    </fieldset></form>
  </section>;
}
