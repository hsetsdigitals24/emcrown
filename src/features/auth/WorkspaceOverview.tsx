// Server component: honest workspace status and permission-aware shortcuts.
import Link from "next/link";
import { ADMIN_COPY as copy } from "@/config/admin";
export default function WorkspaceOverview({ role, canAudit }: { role: string; canAudit: boolean }) {
  return <>
    <section className="workspace-welcome"><div><p className="workspace-eyebrow">{copy.workspace}</p>
      <h2>{copy.welcome}</h2><p>{copy.intro}</p>
      <Link className="admin-button admin-accent" href="/emcrown-admin/security">{copy.settings}<span aria-hidden="true">↗</span></Link>
    </div><div className="workspace-seal" aria-hidden="true"><span>✳</span><span>+</span></div></section>
    <div className="workspace-status-grid">
      <article className="workspace-panel"><span className="workspace-panel-icon" aria-hidden="true">◇</span><h2>{copy.protected}</h2><p>{copy.protectedBody}</p><span className="workspace-badge">{copy.signedIn}</span></article>
      <article className="workspace-panel"><span className="workspace-panel-icon warm" aria-hidden="true">◫</span><h2>{copy.access}</h2><p>{copy.accessBody}</p><span className="workspace-badge neutral">{role.replaceAll("_", " ")}</span></article>
    </div>
    <section className="workspace-panel workspace-next"><div><h2>{copy.next}</h2><p>{copy.nextBody}</p></div>
      <Link className="workspace-text-link" href={canAudit ? "/emcrown-admin/activity" : "/emcrown-admin/security"}>{canAudit ? copy.viewActivity : copy.settings}<span aria-hidden="true">↗</span></Link>
    </section>
    <section className="workspace-planned"><div><h2>{copy.clinical}</h2><p>{copy.clinicalBody}</p></div><span className="workspace-badge neutral">{copy.planned}</span></section>
  </>;
}
