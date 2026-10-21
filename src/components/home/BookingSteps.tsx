// Server component: informational booking steps, with no booking backend or form.
import Container from "@/components/layout/Container";
import BlockHeading from "@/components/home/BlockHeading";
import Button from "@/components/ui/Button";
import Image from "next/image";
import type { BookingStepsContent } from "@/types/home";
export default function BookingSteps({ content }: { content: BookingStepsContent }) {
  return <section id={content.id} aria-labelledby={`${content.id}-heading`} className="home-section booking-section" data-mock={content.isMock}>
    <div className="booking-background" aria-hidden="true">{content.background.images.map((image, index) => <div key={image} className={`booking-background-photo booking-background-photo-${index % 2}`}><Image src={image} alt="" fill unoptimized={image.startsWith("/media/cms/")} sizes="(min-width: 768px) 70vw, 100vw" /></div>)}<div className="booking-background-blend" /></div>
    <Container><div className="booking-layout"><div className="booking-intro"><BlockHeading content={content} /><Button href={content.buttonLink}>{content.buttonLabel}</Button></div>
      <ol className="booking-steps">{content.items.map((item, index) => <li className="booking-step" key={item.id} data-cms-id={item.id}>
        <span className="step-number">{String(index + 1).padStart(2, "0")}</span><div><h3 className="font-heading text-3xl font-light text-primary">{item.title}</h3><p>{item.description}</p></div>
      </li>)}</ol></div><p className="booking-stock-label">{content.background.label}</p></Container>
  </section>;
}
