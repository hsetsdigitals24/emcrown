// Server component: three editable visit steps in normal document flow.
import Container from "@/components/layout/Container";
import BlockHeading from "@/components/home/BlockHeading";
import Reveal from "@/components/motion/Reveal";
import Button from "@/components/ui/Button";
import type { BookingStepsContent } from "@/types/home";
export default function BookingSteps({ content }: { content: BookingStepsContent }) {
  return <section id={content.id} aria-labelledby={`${content.id}-heading`} className="home-section editorial-steps">
    <Container><BlockHeading content={content} centered />
      <Reveal><ol className="editorial-step-grid">{content.items.map((item, index) => <li key={item.id} data-cms-id={item.id}>
        <span className="editorial-step-number" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
        <h3 className="font-heading">{item.title}</h3><p>{item.description}</p>
      </li>)}</ol></Reveal>
      {content.buttonLabel && <div className="editorial-section-action"><Button href={content.buttonLink}>{content.buttonLabel}</Button></div>}
    </Container>
  </section>;
}
