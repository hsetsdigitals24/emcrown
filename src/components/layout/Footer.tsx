// Server component: aligned practice, contact, navigation and visit columns with a separate legal bar.
import BrandLogo from "@/components/ui/BrandLogo";
import Link from "next/link";
import Container from "@/components/layout/Container";
import type { FooterContent } from "@/types/content";

function ContactIcon({ kind }: { kind: "location" | "phone" | "fax" }) {
  return <svg className="footer-contact-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {kind === "location" ? <><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></> : kind === "phone" ? <path d="m7 3 3 5-3 3a17 17 0 0 0 6 6l3-3 5 3-1 4C10 23 1 14 3 4Z" /> : <><path d="M6 9V3h12v6M6 17H3V9h18v8h-3M6 14h12v7H6Z" /><path d="M17 11h1" /></>}
  </svg>;
}

export default function Footer({ content }: { content: FooterContent }) {
  return <footer id="legal-notice" className="site-footer" data-cms-group="footer">
    <div className="footer-texture" aria-hidden="true" />
    <Container>
      <div className="footer-columns">
        <div className="footer-brand"><BrandLogo />
          <h2 className="footer-group-title">{content.practiceName}</h2>
          <p>{content.description}</p>
        </div>
        <div className="footer-group">
          <h2 className="footer-group-title">{content.panels?.contactTitle ?? content.practiceName}</h2>
          <address className="footer-contact-list">
            {content.locations ? content.locations.map((location) => <div className="footer-contact-row" key={location.label}>
              <ContactIcon kind="location" /><div><p className="footer-contact-label">{location.label}</p><p>{location.address}</p></div>
            </div>) : <div className="footer-contact-row"><ContactIcon kind="location" /><p>{content.address}</p></div>}
            {content.phone && <a className="footer-contact-row footer-phone" href={content.phone.href}><ContactIcon kind="phone" /><span>{content.phone.label}</span></a>}
            <div className="footer-contact-row"><ContactIcon kind="fax" /><div><p className="footer-contact-label">{content.faxLabel}</p><p>{content.fax}</p></div></div>
          </address>
        </div>
        <nav className="footer-group" aria-label={content.navigationLabel}>
          <h2 className="footer-group-title">{content.panels?.linksTitle ?? content.navigationLabel}</h2>
          <ul className="footer-links">{content.links.map((link) => <li key={link.href}><Link href={link.href}>{link.label}</Link></li>)}</ul>
        </nav>
        <div className="footer-group">
          <h2 className="footer-group-title">{content.panels?.hoursTitle ?? content.hoursLabel}</h2>
          <div className="footer-hours">{content.hours.map((hours) => <p key={hours}>{hours}</p>)}</div>
          {content.panels?.cta && <Link className="footer-cta" href={content.panels.cta.href}>{content.panels.cta.label}<span aria-hidden="true">↗</span></Link>}
        </div>
      </div>
    </Container>
    <div className="footer-bottom"><Container><div className="footer-bottom-inner">
      <p>{content.copyright}</p>
      <nav aria-label={content.navigationLabel + " — legal"}>{content.legalLinks.map((link, index) => <Link key={`${link.href}-${index}`} href={link.href}>{link.label}</Link>)}</nav>
    </div></Container></div>
  </footer>;
}
