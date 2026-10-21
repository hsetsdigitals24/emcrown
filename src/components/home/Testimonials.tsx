// Server component: editable testimonial content passed to a manual slideshow island.
import TestimonialSlideshow from "@/components/home/TestimonialSlideshow";
import Container from "@/components/layout/Container";
import BlockHeading from "@/components/home/BlockHeading";
import type { TestimonialsContent } from "@/types/home";
export default function Testimonials({ content }: { content: TestimonialsContent }) {
  return <section id={content.id} aria-labelledby={`${content.id}-heading`} className="home-section testimonials-section" data-mock={content.isMock}>
    <Container><BlockHeading content={content} centered /><TestimonialSlideshow controls={content.controls}>{content.testimonials.map((item) => <figure className="testimonial-card" key={item.id} data-cms-id={item.id}>
      <span className="quote-mark" aria-hidden="true">“</span><p className="text-eyebrow uppercase tracking-eyebrow text-textSecondary">{item.label}</p>
      <blockquote className="font-heading font-light text-primary">{item.quote}</blockquote><figcaption>{item.attribution}</figcaption>
    </figure>)}</TestimonialSlideshow></Container>
  </section>;
}
