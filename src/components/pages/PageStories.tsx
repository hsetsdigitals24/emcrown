// Server component: editorial sections reuse the page's existing CMS text and image slots.
import Image from "next/image";
import Container from "@/components/layout/Container";
import Reveal from "@/components/motion/Reveal";
import Button from "@/components/ui/Button";
import type { SectionContent } from "@/types/content";
export default function PageStories({ sections }: { sections: SectionContent[] }) {
  if (!sections.length) return null;
  return <Container><div className="page-stories">{sections.map(section => <Reveal key={section.id} className={section.image ? "page-story-wide" : ""}>
    <section id={section.id} className="page-story" aria-labelledby={`${section.id}-heading`} data-cms-id={section.id}>
      {section.image && <Image src={section.image.src} alt={section.image.alt} width={640} height={480} sizes="(min-width: 768px) 45vw, 100vw" />}
      <div className="page-story-copy">
        {section.eyebrow && <p className="text-eyebrow uppercase tracking-eyebrow">{section.eyebrow}</p>}
        <h2 id={`${section.id}-heading`}>{section.headline} {section.highlightedPhrase}</h2>
        {section.subheading && <p>{section.subheading}</p>}<p>{section.body}</p>
        {section.buttonLabel && section.buttonLink && <div><Button href={section.buttonLink}>{section.buttonLabel}</Button></div>}
      </div>
    </section>
  </Reveal>)}</div></Container>;
}
