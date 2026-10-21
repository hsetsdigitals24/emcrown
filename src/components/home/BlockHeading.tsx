// Server component: shared editable heading slots for homepage sections.
import type { SectionContent } from "@/types/content";
import { BodyText, Eyebrow, Heading } from "@/components/ui/Typography";
export default function BlockHeading({ content, centered = false }: { content: SectionContent; centered?: boolean }) {
  return <div className={`block-heading ${centered ? "mx-auto text-center" : ""}`}>
    <Eyebrow>{content.eyebrow}</Eyebrow>
    <Heading id={`${content.id}-heading`} highlightedPhrase={content.highlightedPhrase}>{content.headline}</Heading>
    {content.body && <BodyText>{content.body}</BodyText>}
  </div>;
}
