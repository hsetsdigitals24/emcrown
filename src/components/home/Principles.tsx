// Server component: navy principles remain fully readable without scroll scripting.
import Container from "@/components/layout/Container";
import type { HomeBlock } from "@/types/home";
export default function Principles({ content }: { content: HomeBlock }) {
  return <section id={content.id} aria-labelledby={`${content.id}-heading`} className="principles-section home-section" data-mock={content.isMock}>
    <Container><div className="principles-panel"><div className="principles-intro">
      <p className="text-eyebrow uppercase tracking-eyebrow">{content.eyebrow}</p>
      <h2 id={`${content.id}-heading`} className="font-heading text-heading font-light leading-heading">{content.headline}<br /><span className="text-surfaceSoft">{content.highlightedPhrase}</span></h2>
      <p className="text-surfaceSoft">{content.body}</p>
    </div><ol className="principles-list">{content.items.map((item, index) => <li key={item.id} data-cms-id={item.id} className="principle-item">
      <span className="principle-number">{String(index + 1).padStart(2, "0")}</span><div><h3 className="font-heading text-2xl font-light">{item.title}</h3><p>{item.description}</p></div>
    </li>)}</ol></div></Container>
  </section>;
}
