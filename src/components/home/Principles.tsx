// Server component: three editable overview cards in the reference site's rounded style.
import Container from "@/components/layout/Container";
import BlockHeading from "@/components/home/BlockHeading";
import FeatureIcon, { type FeatureIconKind } from "@/components/home/FeatureIcon";
import Button from "@/components/ui/Button";
import type { HomeBlock } from "@/types/home";
const ICONS: FeatureIconKind[] = ["person", "heart", "calendar"];
export default function Principles({ content }: { content: HomeBlock }) {
  return <section id={content.id} aria-labelledby={`${content.id}-heading`} className="principles-section home-section" data-mock={content.isMock}>
    <Container><BlockHeading content={content} centered cmsPrefix="principles" /><ol className="reference-features">{content.items.map((item, index) => <li key={item.id} data-cms-id={item.id} className="reference-feature">
      <div className="reference-feature-top"><FeatureIcon kind={ICONS[index % ICONS.length]} /><span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span></div>
      <h3>{item.title}</h3><p>{item.description}</p>
      {item.link && <Button purpose="primary" href={item.link.href} cmsField={"principles.items." + index + ".link.label"}>{item.link.label}<span aria-hidden="true">›</span></Button>}
    </li>)}</ol></Container>
  </section>;
}
