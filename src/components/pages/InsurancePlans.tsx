// Server component: configuration selects coming-soon versus approved plan listings.
import type { InsuranceConfig } from "@/types/public";
import Container from "@/components/layout/Container";
import Card from "@/components/ui/Card";
export default function InsurancePlans({ settings }: { settings: InsuranceConfig }) {
  return <Container><div className="entry-details">
    {settings.state === "comingSoon" ? <p className="status-badge">{settings.comingSoonLabel}</p> : <section>
      <h2 className="font-heading text-heading font-light text-primary">{settings.availableLabel}</h2>
      <ul className="public-plan-list">{settings.plans.map((plan) => <li key={plan.id}><Card><h3 className="font-heading text-2xl text-primary">{plan.name}</h3><p>{plan.description}</p></Card></li>)}</ul>
    </section>}
  </div></Container>;
}
