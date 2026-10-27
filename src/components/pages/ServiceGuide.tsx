// Server component: image-led, editable guide with small interactive and scroll-reveal islands.
import Image from "next/image";
import Link from "next/link";
import Container from "@/components/layout/Container";
import Reveal from "@/components/motion/Reveal";
import GuideNavigation from "@/components/pages/GuideNavigation";
import GuideAnswer from "@/components/pages/GuideAnswer";
import GuideChecklist from "@/components/pages/GuideChecklist";
import Closing from "@/components/home/Closing";
import { Heading, Eyebrow, BodyText } from "@/components/ui/Typography";
import { GUIDE_EXPERIENCE_COPY as copy } from "@/config/pages/guide-experience";
import { BOOKING_CTA } from "@/config/pages/helpers";
import type { ServiceEntry } from "@/types/public";
export default function ServiceGuide({ entry, closing = BOOKING_CTA }: { entry: ServiceEntry; closing?: typeof BOOKING_CTA }) {
  return <>
    <header className="guide-hero informational-hero"><Container>
      <Link href="/services" className="guide-back-link">← {copy.back}</Link>
      <div className="guide-hero-grid"><Reveal><div className="guide-hero-copy">
        <Eyebrow>{entry.category}</Eyebrow>
        <Heading as="h1" display highlightedPhrase={entry.hero.highlightedPhrase}>{entry.hero.headline}</Heading>
        <BodyText>{entry.hero.body}</BodyText>
        <a className="guide-anchor" href="#guide-checklist">{copy.checklist} <span aria-hidden="true">↓</span></a>
      </div></Reveal><figure className="guide-hero-photo"><Image unoptimized loading="eager" src={entry.image} alt="" fill sizes="(min-width: 1024px) 560px, 100vw" /><figcaption>{copy.imageLabel}</figcaption></figure></div>
    </Container></header>
    <Container><div className="guide-body-layout">
      <aside className="guide-sidebar"><GuideNavigation label={copy.onPage} links={[
        ...entry.sections.map((section, index) => ({ id: `guide-step-${index + 1}`, label: section.headline, number: `0${index + 1}` })),
        { id: "guide-checklist", label: copy.checklist }, { id: "guide-answers", label: copy.faq },
      ]} /></aside>
      <div className="guide-main">
        <Reveal><section className="guide-intro"><Eyebrow>{copy.overview}</Eyebrow><p>{entry.guide.intro}</p></section></Reveal>
        <div className="guide-steps">{entry.sections.map((section, index) => <Reveal key={section.id} distance={24} duration={650}>
          <section id={`guide-step-${index + 1}`} className="guide-step"><span className="guide-step-number" aria-hidden="true">0{index + 1}</span><div><Eyebrow>{copy.step} {index + 1}</Eyebrow><h2 className="font-heading">{section.headline}</h2><BodyText>{section.body}</BodyText><blockquote>{entry.guide.prompts[index]}</blockquote></div></section>
        </Reveal>)}</div>
        <Reveal><section id="guide-checklist" className="guide-check-panel"><Eyebrow>{copy.steps}</Eyebrow><h2 className="font-heading">{copy.checklist}</h2><p>{copy.checklistHint}</p><GuideChecklist items={entry.guide.checklist} completedLabel={copy.completed} resetLabel={copy.reset} /></section></Reveal>
        <Reveal><section id="guide-answers" className="guide-answers"><Eyebrow>{copy.prompts}</Eyebrow><h2 className="font-heading">{copy.faq}</h2>{entry.guide.questions.map(question => <GuideAnswer key={question.title}><summary>{question.title}<span aria-hidden="true">+</span></summary><p>{question.body}</p></GuideAnswer>)}<Link className="guide-anchor" href={copy.contactLink}>{copy.contact} ↗</Link></section></Reveal>
        <nav className="guide-footer-nav" aria-label={copy.next}><Link href="/services">← {copy.back}</Link></nav>
      </div>
    </div></Container>
    <Closing content={{ ...closing, items: [] }} />
  </>;
}
