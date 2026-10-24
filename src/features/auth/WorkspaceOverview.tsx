// Server component: permission-aware workspace highlights and direct task navigation.
import Link from "next/link";
import { ADMIN_COPY, OVERVIEW_COPY as copy, OVERVIEW_TOOLS } from "@/config/admin";
import { hasPermission } from "@/config/auth";
import type { AdminRole } from "@/types/auth";
export default function WorkspaceOverview({ role, canAudit }: { role: AdminRole; canAudit: boolean }) {
  const tools = OVERVIEW_TOOLS.filter(tool => hasPermission(role, tool.permission) && (tool.permission !== "audit:read" || canAudit));
  return <div className="overview">
    <section className="overview-intro" aria-labelledby="overview-title">
      <div><p className="workspace-eyebrow">{copy.eyebrow}</p><h2 id="overview-title">{copy.title}</h2><p className="overview-description">{copy.intro}</p></div>
      <div className="overview-session"><span className="workspace-badge">{ADMIN_COPY.signedIn}</span><strong>{role.replaceAll("_", " ")}</strong><p>{copy.accountBody}</p></div>
    </section>
    <section aria-labelledby="overview-quick-title">
      <div className="overview-section-heading"><div><h2 id="overview-quick-title">{copy.quick}</h2><p>{copy.quickBody}</p></div></div>
      <div className="overview-tools">{tools.map(tool => <Link key={tool.href} href={tool.href} prefetch={false} className="overview-tool">
        <div className="overview-tool-top"><span className="workspace-panel-icon" aria-hidden="true">{tool.icon}</span><span className="overview-tool-arrow" aria-hidden="true">↗</span></div>
        <p className="workspace-eyebrow">{tool.eyebrow}</p><h3>{tool.label}</h3><p className="overview-tool-description">{tool.description}</p>
        <ul>{tool.highlights.map(highlight => <li key={highlight}>{highlight}</li>)}</ul>
        <span className="overview-tool-action">{tool.action}<span aria-hidden="true">→</span></span>
      </Link>)}</div>
    </section>
    <section className="overview-public"><div><h2>{ADMIN_COPY.publicSite}</h2><p>{copy.websiteBody}</p></div><Link className="workspace-text-link" href="/" prefetch={false}>{ADMIN_COPY.publicSite}<span aria-hidden="true">↗</span></Link></section>
  </div>;
}
