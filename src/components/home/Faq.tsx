// Server component: native accessible accordions work without JavaScript.
import FaqHover from "@/components/home/FaqHover";
import Container from "@/components/layout/Container";
import BlockHeading from "@/components/home/BlockHeading";
import type { FaqContent } from "@/types/home";
export default function Faq({ content }: { content: FaqContent }) {
  return <section id={content.id} aria-labelledby={`${content.id}-heading`} className="home-section" data-mock={content.isMock}>
    <Container><div className="faq-layout"><BlockHeading content={content} /><FaqHover>{content.questions.map((item) => <details className="faq-item" key={item.id} data-cms-id={item.id} name="home-faq">
      <summary><span>{item.question}</span><span className="faq-plus" aria-hidden="true">+</span></summary><div className="faq-answer"><p>{item.answer}</p></div>
    </details>)}</FaqHover></div></Container>
  </section>;
}
