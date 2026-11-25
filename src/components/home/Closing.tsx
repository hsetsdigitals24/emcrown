// Server component: photographic appointment banner using CMS content and media.
import Image from "next/image";
import Container from "@/components/layout/Container";
import BlockHeading from "@/components/home/BlockHeading";
import Button from "@/components/ui/Button";
import type { HomeBlock } from "@/types/home";
export default function Closing({ content }: { content: HomeBlock }) {
  return <section id={content.id} aria-labelledby={`${content.id}-heading`} className="home-section closing-section" data-mock={content.isMock}>
    {content.image && <div className="reference-closing-photo" data-cms-field="closing.image.src"><Image src={content.image.src} alt={content.image.alt} fill sizes="100vw" unoptimized={content.image.src.startsWith("/media/cms/")} /></div>}
    <Container><div className="closing-content"><BlockHeading content={content} cmsPrefix="closing" /><Button purpose="primary" bookingAction href={content.buttonLink} cmsField="closing.buttonLabel">{content.buttonLabel}<span aria-hidden="true">›</span></Button></div></Container>
  </section>;
}
