// Shared rendering: informational pages retain their existing components and content contracts.
import PageFrame from "@/components/pages/PageFrame";
import CatalogGrid from "@/components/pages/CatalogGrid";
import Container from "@/components/layout/Container";
import PracticeLocations from "@/components/pages/PracticeLocations";
import ContactForm from "@/components/pages/ContactForm";
import FaqGroups from "@/components/pages/FaqGroups";
import StructuredData from "@/components/pages/StructuredData";
import { canIndexPublicContent } from "@/lib/public-metadata";
import InsurancePlans from "@/components/pages/InsurancePlans";
import { PhysicianDetails, ArticleDetails } from "@/components/pages/EntryDetails";
import { PAGE_SEEDS, SITE_SEED, SERVICE_ENTRIES, PHYSICIAN_ENTRIES, ARTICLE_ENTRIES, LEGAL_ENTRIES } from "@/config/cms/content";
import { applyContent } from "@/features/cms/fields";
import type { CmsValues } from "@/types/cms";
import type { PageContent } from "@/types/public";
export type CmsContext = Record<string, CmsValues | null>;
export function InformationContent({ path, values, site, context }: { path: string; values: CmsValues; site: typeof SITE_SEED; context: CmsContext }) {
  const fixture = Object.values(PAGE_SEEDS).find(seed => seed.content.path === path)?.content
    ?? [...SERVICE_ENTRIES, ...PHYSICIAN_ENTRIES, ...ARTICLE_ENTRIES, ...LEGAL_ENTRIES].find(entry => entry.path === path);
  if (!fixture) return null;
  const content = applyContent<{ content: PageContent }>({ content: fixture }, values).content;
  const legal = applyContent(PAGE_SEEDS["/legal"], values).copy;
  const entries = path === "/services" ? SERVICE_ENTRIES : path === "/physicians" ? PHYSICIAN_ENTRIES : path === "/resources" ? ARTICLE_ENTRIES : path === "/legal" ? LEGAL_ENTRIES.map(entry => ({ ...entry, category: legal.category })) : [];
  const catalog = entries.filter(entry => context[entry.path] !== null).map(entry => applyContent({ content: entry }, context[entry.path] ?? {}).content);
  const actionLabel = path === "/physicians" ? site.catalog.physicianLink : path === "/resources" ? site.catalog.articleLink : path === "/legal" ? legal.read : site.catalog.serviceLink;
  const physician = PHYSICIAN_ENTRIES.find(entry => entry.path === path);
  const article = ARTICLE_ENTRIES.find(entry => entry.path === path);
  const contact = applyContent(PAGE_SEEDS["/contact"], values);
  const faq = applyContent(PAGE_SEEDS["/faq"], values);
  return <PageFrame content={content} closing={site.closing} enhancedMotion={path === "/services"}>
    {catalog.length > 0 && <div className="home-section"><Container>
      {path === "/resources" && <nav aria-label={site.catalog.categories} className="resource-categories">{catalog.map(entry => <a key={entry.slug} className="recovery-link" href={`#${entry.slug}`}>{entry.category}</a>)}</nav>}
      <CatalogGrid entries={catalog} actionLabel={actionLabel}
      images={path === "/physicians" || path === "/resources"} portraits={path === "/physicians"} serviceMotion={path === "/services"} /></Container></div>}
    {physician && <PhysicianDetails entry={applyContent({ content: physician }, values).content} copy={site.catalog} />}
    {article && <ArticleDetails entry={applyContent({ content: article }, values).content} />}
    {path === "/insurance" && <InsurancePlans settings={applyContent(PAGE_SEEDS["/insurance"], values).insurance} />}
    {path === "/faq" && <div className="home-section"><Container><StructuredData enabled={canIndexPublicContent(content)} data={{ "@context": "https://schema.org", "@type": "FAQPage",
      mainEntity: faq.groups.flatMap(group => group.items.map(item => ({ "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer } }))) }} /><FaqGroups groups={faq.groups} /></Container></div>}
    {path === "/contact" && <div className="home-section"><Container><div className="contact-links">
      <div><h2>{contact.copy.phone}</h2><a href={site.practice.phone.href}>{site.practice.phone.label}</a></div>
      <div><h2>{contact.copy.email}</h2>{site.practice.email ? <a href={`mailto:${site.practice.email}`}>{site.practice.email}</a> : <p>{contact.copy.emailPending}</p>}</div>
      <div><h2>{contact.copy.fax}</h2><p>{site.practice.fax}</p></div>
    </div><PracticeLocations practice={site.practice} copy={contact.copy} /><ContactForm copy={contact.copy} /></Container></div>}
    {LEGAL_ENTRIES.some(entry => entry.path === path) && <Container><p className="entry-details">{site.legal.updated}: {site.legal.updateValue}</p>
      {path === "/privacy" && <a className="recovery-link" href="/notice-of-privacy-practices">{site.legal.notice}</a>}</Container>}
  </PageFrame>;
}
