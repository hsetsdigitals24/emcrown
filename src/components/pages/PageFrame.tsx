// Server component: shared editable informational hero, content blocks and booking CTA.
import type { ReactNode } from "react";
import type { PageContent } from "@/types/public";
import Container from "@/components/layout/Container";
import Reveal from "@/components/motion/Reveal";
import { Heading, Eyebrow, BodyText } from "@/components/ui/Typography";
import Button from "@/components/ui/Button";
import Section from "@/components/sections/Section";
import Closing from "@/components/home/Closing";
import PhotoPlaceholder from "@/components/home/PhotoPlaceholder";
import { BOOKING_CTA } from "@/config/pages/helpers";
export default function PageFrame({ content, children, enhancedMotion = false, closing = BOOKING_CTA }: { content: PageContent; children?: ReactNode; enhancedMotion?: boolean; closing?: typeof BOOKING_CTA }) {
  return <>
    <header className="informational-hero" data-mock={content.hero.isMock}>
      <Container><Reveal selector={enhancedMotion ? ".public-heading > *" : undefined} duration={enhancedMotion ? 850 : 480} interval={110} distance={enhancedMotion ? 28 : 16}><div className="public-heading">
        <Eyebrow>{content.hero.eyebrow}</Eyebrow>
        <Heading as="h1" display highlightedPhrase={content.hero.highlightedPhrase} cmsFields={{ headline: "content.hero.headline", highlightedPhrase: "content.hero.highlightedPhrase" }}>{content.hero.headline}</Heading>
        {content.hero.subheading && <BodyText>{content.hero.subheading}</BodyText>}
        <BodyText>{content.hero.body}</BodyText>
        {content.hero.buttonLabel && content.hero.buttonLink && <div><Button purpose="primary" href={content.hero.buttonLink}>{content.hero.buttonLabel}</Button></div>}<p className="preview-notice">{content.notice}</p>
      </div></Reveal></Container>
    </header>
    {content.photoLabel && <Container><div className="public-photo"><PhotoPlaceholder label={content.photoLabel} /></div></Container>}
    {children}
    {content.sections.map((section, index) => <Reveal key={section.id} duration={enhancedMotion ? 760 : 480} distance={enhancedMotion ? 24 : 16}><Section content={section} tone={index % 2 ? "alt" : "plain"} /></Reveal>)}
    {enhancedMotion ? <Reveal duration={800} distance={24}><Closing content={{ ...closing, items: [] }} /></Reveal> : <Closing content={{ ...closing, items: [] }} />}
  </>;
}
