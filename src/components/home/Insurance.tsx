// Server component: editable insurance summary and appointment documents.
import Container from "@/components/layout/Container";
import BlockHeading from "@/components/home/BlockHeading";
import FeatureIcon from "@/components/home/FeatureIcon";
import Button from "@/components/ui/Button";
import type { HomeBlock } from "@/types/home";
export default function Insurance({ content }: { content: HomeBlock }) {
  return <section id={content.id} className="home-section reference-insurance" aria-labelledby={content.id + "-heading"} data-cms-group="insurance">
    <Container><div className="reference-insurance-grid">
      <div><BlockHeading content={content} cmsPrefix="insurance" /><Button purpose="primary" href={content.buttonLink} cmsField="insurance.buttonLabel">{content.buttonLabel}<span aria-hidden="true">›</span></Button></div>
      <div className="reference-insurance-documents"><FeatureIcon kind="shield" /><h3 data-cms-field="insurance.subheading">{content.subheading}</h3>
        <ul className="reference-values">{content.items.map((item, index) => <li key={item.id} data-cms-id={item.id}><span aria-hidden="true">✓</span><span data-cms-field={"insurance.items." + index + ".title"}>{item.title}</span></li>)}</ul>
      </div>
    </div></Container>
  </section>;
}
