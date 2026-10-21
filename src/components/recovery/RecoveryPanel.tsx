// Universal presentation: recovery copy arrives through props; no errors are exposed.
import Link from "next/link";
import Container from "@/components/layout/Container";
import { Heading, Eyebrow, BodyText } from "@/components/ui/Typography";
import type { RECOVERY_COPY } from "@/config/pages/recovery";
import type { ReactNode } from "react";
type Props = { content: typeof RECOVERY_COPY.notFound; homeLabel: string; bookingLabel: string; children?: ReactNode };
export default function RecoveryPanel({ content, homeLabel, bookingLabel, children }: Props) {
  return <div className="home-section"><Container><div className="public-heading">
    <Eyebrow>{content.eyebrow}</Eyebrow><Heading as="h1" display highlightedPhrase={content.highlightedPhrase}>{content.headline}</Heading><BodyText>{content.body}</BodyText>
    <div className="flex flex-wrap gap-4"><Link href="/" className="recovery-link">{homeLabel}</Link><Link href="/book" className="recovery-link">{bookingLabel}</Link></div>
    {children}
  </div></Container></div>;
}
