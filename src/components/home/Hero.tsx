// Server component: full-width reference hero with CMS-managed text and photography.
import Image from "next/image";
import Container from "@/components/layout/Container";
import Button from "@/components/ui/Button";
import { Heading } from "@/components/ui/Typography";
import type { HeroContent } from "@/types/home";
export default function Hero({ content }: { content: HeroContent }) {
  return <section id={content.id} aria-labelledby="hero-heading" className="reference-hero" data-cms-group="hero">
    <div className="reference-hero-photo" data-cms-field="hero.media.poster">
      <Image loading="eager" fetchPriority="high" src={content.media.poster} alt={content.photoLabel} fill
        unoptimized={content.media.poster.startsWith("/media/cms/")} sizes="100vw" />
    </div>
    <Container><div className="reference-hero-copy">
        <Heading as="h1" display id="hero-heading" highlightedPhrase={content.highlightedPhrase}
          cmsFields={{ headline: "hero.headline", highlightedPhrase: "hero.highlightedPhrase" }}>{content.headline}</Heading>
        {content.subheading && <p className="reference-hero-subheading" data-cms-field="hero.subheading">{content.subheading}</p>}
        <p className="reference-hero-body" data-cms-field="hero.body">{content.body}</p>
        <div className="reference-actions" data-cms-field="hero.buttonLabel"><Button purpose="primary" bookingAction href={content.buttonLink}>{content.buttonLabel}<span aria-hidden="true">›</span></Button></div>
    </div></Container>
  </section>;
}
