// Server component: homepage introduction and values, all supplied through CMS slots.
import Image from "next/image";
import Container from "@/components/layout/Container";
import BlockHeading from "@/components/home/BlockHeading";
import Button from "@/components/ui/Button";
import type { AboutContent } from "@/types/home";
export default function About({ content }: { content: AboutContent }) {
  return <section id={content.id} className="home-section reference-about" aria-labelledby={content.id + "-heading"} data-cms-group="about">
    <Container><div className="reference-about-grid">
      <figure className="reference-about-photo" data-cms-field="about.image.src">
        <Image src={content.image.src} alt={content.image.alt} width={600} height={750}
          sizes="(min-width: 1280px) 520px, (min-width: 768px) 45vw, 100vw" unoptimized={content.image.src.startsWith("/media/cms/")} />
      </figure>
      <div className="reference-about-copy"><BlockHeading content={content} cmsPrefix="about" />
        <h3 data-cms-field="about.subheading">{content.subheading}</h3>
        <ul className="reference-values">{content.items.map((item, index) => <li key={item.id} data-cms-id={item.id}><span aria-hidden="true">✓</span><span data-cms-field={"about.items." + index + ".title"}>{item.title}</span></li>)}</ul>
        <div className="reference-actions" data-cms-field="about.buttonLabel"><Button purpose="primary" href={content.buttonLink}>{content.buttonLabel}<span aria-hidden="true">›</span></Button></div>
      </div>
    </div></Container>
  </section>;
}
