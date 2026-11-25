// Server component: readable guide content and direct navigation shared by both catalogs.
import Image from "next/image";
import Link from "next/link";
export default function GuideCard({ title, description, category, href, action, heading: Heading = "h3", image, showImage = false }: {
  title: string; description: string; category?: string; href: string; action: string;
  image?: string; imageLabel?: string; heading?: "h2" | "h3"; showImage?: boolean;
}) {
  return <div className="service-card">
    {showImage && image && <Image className="catalog-photo" src={image} alt="" width={512} height={320} sizes="(min-width: 1024px) 360px, (min-width: 768px) 45vw, 100vw" />}
    {category && <span className="service-tag">{category}</span>}
    <Heading className="font-heading"><Link href={href}>{title}</Link></Heading>
    <p>{description}</p>
    <Link className="editorial-card-link" href={href}>{action}<span aria-hidden="true">↗</span></Link>
  </div>;
}
