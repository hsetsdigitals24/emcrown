// Server component: coverage is explicitly coming soon; no invented plans.
import Container from "@/components/layout/Container";
import BlockHeading from "@/components/home/BlockHeading";
import Button from "@/components/ui/Button";
import type { HomeBlock } from "@/types/home";
export default function Insurance({ content }: { content: HomeBlock }) {
  return <section id={content.id} aria-labelledby={`${content.id}-heading`} className="home-section" data-mock={content.isMock}>
    <Container><div className="insurance-panel"><BlockHeading content={content} /><div className="insurance-action"><span className="status-badge">{content.subheading}</span><Button href={content.buttonLink}>{content.buttonLabel}</Button></div></div></Container>
  </section>;
}
