// Server component: editable section block; motion stays in a separate wrapper.
import type { ReactNode } from "react";
import Container from "@/components/layout/Container";
import { BodyText, Eyebrow, Heading } from "@/components/ui/Typography";
import Button from "@/components/ui/Button";
import type { SectionContent } from "@/types/content";
export default function Section({ content, children, tone = "plain" }: {
  content: SectionContent; children?: ReactNode; tone?: "plain" | "alt" | "gradient";
}) {
  const backgrounds = { plain: "bg-background", alt: "bg-sectionAlt", gradient: "bg-linear-to-b from-background to-surfaceSoft" };
  return <section id={content.id} aria-labelledby={`${content.id}-heading`} data-mock={content.isMock || undefined}
    className={`py-section-mobile md:py-section ${backgrounds[tone]}`}>
    <Container><div className="flex min-w-0 flex-col gap-6">
      {content.eyebrow && <Eyebrow>{content.eyebrow}</Eyebrow>}
      <Heading id={`${content.id}-heading`} highlightedPhrase={content.highlightedPhrase}>{content.headline}</Heading>
      {content.subheading && <BodyText>{content.subheading}</BodyText>}
      {content.body && <BodyText>{content.body}</BodyText>}
      {children}
      {content.buttonLabel && content.buttonLink && <div><Button href={content.buttonLink}>{content.buttonLabel}</Button></div>}
    </div></Container>
  </section>;
}
