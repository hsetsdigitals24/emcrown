// Server component: shared editable informational hero, content blocks and booking CTA.
import type { ReactNode } from "react";
import type { PageContent } from "@/types/public";
import Container from "@/components/layout/Container";
import Reveal from "@/components/motion/Reveal";
import { Heading, Eyebrow, BodyText } from "@/components/ui/Typography";
import Button from "@/components/ui/Button";
import Image from "next/image";
import PageStories from "@/components/pages/PageStories";
import Closing from "@/components/home/Closing";
import PhotoPlaceholder from "@/components/home/PhotoPlaceholder";
import { BOOKING_CTA } from "@/config/pages/helpers";
export default function PageFrame({ content, children, enhancedMotion = false, closing = BOOKING_CTA }: { content: PageContent; children?: ReactNode; enhancedMotion?: boolean; closing?: typeof BOOKING_CTA }) {
  return <>
    <header className="informational-hero" data-mock={content.hero.isMock}>
      <Container><div className={content.hero.image ? "page-intro-grid" : ""}><Reveal selector={enhancedMotion ? ".public-heading > *" : undefined} duration={enhancedMotion ? 850 : 480} interval={110} distance={enhancedMotion ? 28 : 16}><div className="public-heading">
        <Eyebrow>{content.hero.eyebrow}</Eyebrow>
        <Heading as="h1" display highlightedPhrase={content.hero.highlightedPhrase} cmsFields={{ headline: "content.hero.headline", highlightedPhrase: "content.hero.highlightedPhrase" }}>{content.hero.headline}</Heading>
        {content.hero.subheading && <BodyText>{content.hero.subheading}</BodyText>}
        <BodyText>{content.hero.body}</BodyText>
        {content.hero.buttonLabel && content.hero.buttonLink && <div><Button purpose="primary" href={content.hero.buttonLink}>{content.hero.buttonLabel}</Button></div>}<p className="preview-notice">{content.notice}</p>
      </div></Reveal>{content.hero.image && <figure className="page-intro-image"><Image loading="eager" src={content.hero.image.src} alt={content.hero.image.alt} width={640} height={520} sizes="(min-width: 768px) 45vw, 100vw" /></figure>}</div></Container>
    </header>
    {content.photoLabel && <Container><div className="public-photo"><PhotoPlaceholder label={content.photoLabel} /></div></Container>}
    {children}
    <PageStories sections={content.sections} />
    {enhancedMotion ? <Reveal duration={800} distance={24}><Closing content={{ ...closing, items: [] }} /></Reveal> : <Closing content={{ ...closing, items: [] }} />}
  </>;
}
