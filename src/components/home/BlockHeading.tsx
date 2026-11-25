// Server component: shared editable heading slots for homepage sections.
import type { SectionContent } from "@/types/content";
import { BodyText, Eyebrow, Heading } from "@/components/ui/Typography";
export default function BlockHeading({ content, centered = false, cmsPrefix }: { content: SectionContent; centered?: boolean; cmsPrefix?: string }) {
  return <div className={`block-heading ${centered ? "mx-auto text-center" : ""}`}>
    <Eyebrow cmsField={cmsPrefix && cmsPrefix + ".eyebrow"}>{content.eyebrow}</Eyebrow>
    <Heading id={`${content.id}-heading`} highlightedPhrase={content.highlightedPhrase} cmsFields={cmsPrefix ? { headline: cmsPrefix + ".headline", highlightedPhrase: cmsPrefix + ".highlightedPhrase" } : undefined}>{content.headline}</Heading>
    {content.body && <BodyText cmsField={cmsPrefix && cmsPrefix + ".body"}>{content.body}</BodyText>}
  </div>;
}
