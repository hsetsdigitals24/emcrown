// Server component: aligned practice, contact, navigation and visit columns with a separate legal bar.
import BrandLogo from "@/components/ui/BrandLogo";
import ContactIcon from "@/components/ui/ContactIcon";
import Link from "next/link";
import Container from "@/components/layout/Container";
import type { FooterContent } from "@/types/content";

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
      <nav aria-label={content.legalNavigationLabel ?? content.navigationLabel}>{content.legalLinks.map((link, index) => <Link key={`${link.href}-${index}`} href={link.href}>{link.label}</Link>)}</nav>
    </div></Container></div>
  </footer>;
}
