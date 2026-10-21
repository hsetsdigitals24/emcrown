// Server component: grouped FAQ disclosures with keyboard and no-JavaScript support.
import type { FaqGroup } from "@/types/public";
export default function FaqGroups({ groups }: { groups: FaqGroup[] }) {
  return <div className="faq-groups">{groups.map((group) => <section key={group.id} data-cms-id={group.id} aria-labelledby={`${group.id}-heading`}>
    <h2 id={`${group.id}-heading`} className="font-heading text-heading font-light text-primary">{group.title}</h2>
    <div className="mt-6">{group.items.map((item) => <details key={item.id} data-cms-id={item.id} className="faq-item" name={`faq-${group.id}`}>
      <summary><span>{item.question}</span><span className="faq-plus" aria-hidden="true">+</span></summary><div className="faq-answer"><p>{item.answer}</p></div>
    </details>)}</div>
  </section>)}</div>;
}
