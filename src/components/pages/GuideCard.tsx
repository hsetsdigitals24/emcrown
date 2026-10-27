// Server component: shared image face and editable guide details for both catalogs.
import Image from "next/image";
import Link from "next/link";
import GuideFlip from "@/components/motion/GuideFlip";
import { GUIDE_CARD_COPY } from "@/config/pages/guide-card";
export default function GuideCard({ title, description, category, href, action, image, imageLabel }: {
  title: string; description: string; category?: string; href: string; action: string;
  image: string; imageLabel: string;
}) {
  // These small WebPs are precompressed; direct URLs avoid stale optimizer failures during development.
  return <GuideFlip label={`${GUIDE_CARD_COPY.turn}: ${title}`} closeLabel={GUIDE_CARD_COPY.close} front={<Image unoptimized loading="eager" src={image} alt={title} fill sizes="(min-width: 1200px) 380px, (min-width: 768px) 45vw, 100vw" />}>
    <div className="guide-details">
      {category && <span className="service-tag">{category}</span>}
      <h3 className="font-heading text-2xl font-light text-primary">{title}</h3>
      <p>{description}</p>
      <Link className="inline-flex min-h-target items-center gap-3 text-primary" href={href}>{action}<span aria-hidden="true">↗</span></Link>
      <small>{imageLabel}</small>
    </div>
  </GuideFlip>;
}
