// Server component: editable hero; word splitting is derived from plain CMS strings.
import HeroEntrance from "@/components/motion/HeroEntrance";
import Button from "@/components/ui/Button";
import Image from "next/image";
import HeroVideo from "@/components/home/HeroVideo";
import type { HeroContent } from "@/types/home";
function Words({ text, highlighted = false }: { text: string; highlighted?: boolean }) {
  return <span className={highlighted ? "hero-highlight" : ""}>{text.split(" ").map((word, index) =>
    <span key={`${word}-${index}`} className="hero-word-clip inline-block"><span className="hero-word inline-block">{word}{" "}</span></span>,
  )}</span>;
}
export default function Hero({ content }: { content: HeroContent }) {
  return <HeroEntrance><section id={content.id} aria-labelledby="hero-heading" className="home-hero" data-mock={content.isMock}>
    <div className="hero-stage"><div className="hero-copy-track"><div className="hero-copy">
      <p data-cms-field="hero.eyebrow" className="text-eyebrow uppercase tracking-eyebrow">{content.eyebrow}</p>
      <h1 id="hero-heading" aria-label={`${content.headline} ${content.highlightedPhrase}`} className="hero-title font-heading font-light">
        <span aria-hidden="true"><span data-cms-field="hero.headline"><Words text={content.headline} /></span><br /><span data-cms-field="hero.highlightedPhrase"><Words text={content.highlightedPhrase} highlighted /></span></span>
      </h1>
      <p className="hero-description">{content.body}</p>
      <div className="hero-actions flex flex-wrap justify-center gap-4"><Button purpose="primary" href={content.buttonLink}>{content.buttonLabel}</Button></div>
      <p className="preview-notice">{content.notice}</p>
    </div></div>
    <div className="hero-media" data-cms-field="hero.media.poster"><HeroVideo media={content.media} /><div className="hero-media-shade" /></div>
    <div className="hero-photo" data-cms-field="hero.media.photo"><Image src={content.media.photo} alt={content.photoLabel} fill unoptimized={content.media.photo.startsWith("/media/cms/")} sizes="(min-width: 1024px) 160px, 96px" /></div>
    <span className="hero-chip">{content.media.label}</span><p className="hero-caption">{content.imageCaption}</p>
    </div>
  </section></HeroEntrance>;
}
