// Server component: quiet wave CTA, blue to preserve the single orange navigation action.
import Container from "@/components/layout/Container";
import BlockHeading from "@/components/home/BlockHeading";
import Button from "@/components/ui/Button";
import type { HomeBlock } from "@/types/home";
export default function Closing({ content }: { content: HomeBlock }) {
  return <section id={content.id} aria-labelledby={`${content.id}-heading`} className="home-section closing-section" data-mock={content.isMock}>
    <div className="closing-wave" aria-hidden="true" /><Container><div className="closing-content"><BlockHeading content={content} centered /><Button purpose="primary" href={content.buttonLink}>{content.buttonLabel}</Button></div></Container>
  </section>;
}
