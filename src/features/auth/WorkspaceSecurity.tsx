// Server component: recovery controls and permission-checked one-time client handover.
import Link from "next/link";
import { ADMIN_COPY as copy } from "@/config/admin";
import { HANDOVER_COPY as security } from "@/config/handover";
import { AUTH_COPY } from "@/config/auth";
import { securityDetails } from "@/features/auth/ownership";
import SecurityRefresh from "@/features/auth/SecurityRefresh";
import SecurityForm from "@/features/auth/SecurityForm";
export default async function WorkspaceSecurity({ canManage }: { canManage: boolean }) {
  const details = await securityDetails();
  return <><section className="workspace-section-heading"><p className="workspace-eyebrow">{copy.security}</p><h2>{copy.securityTitle}</h2></section>
    <div className="workspace-status-grid">
      <section className="workspace-panel"><h2>{copy.password}</h2><p>{copy.passwordBody}</p><Link className="workspace-text-link" href="/emcrown-admin/forgot-password">{copy.reset} ↗</Link></section>
      <section className="workspace-panel"><h2>{security.recoveryTitle}</h2><p>{security.recoveryIntro}</p><SecurityForm mode="codes" /></section>
      {details?.isOwner && <section className="workspace-panel"><h2>{security.inviteTitle}</h2><p>{security.inviteIntro}</p><SecurityForm mode="invite" /></section>}
      <section className="workspace-panel"><h2>{copy.delivery}</h2><p>{copy.deliveryBody}</p>{canManage && <Link className="workspace-text-link" href="/emcrown-admin/activity">{AUTH_COPY.audit} ↗</Link>}</section>
    </div>
    {details?.locked ? <section className="workspace-panel"><h2>{security.transferTitle}</h2><p role="status">{security.locked}</p></section>
      : details?.isOwner && <section className="workspace-panel admin-handover"><h2>{security.transferTitle}</h2><p>{security.transferIntro}</p><SecurityRefresh />
        {details.candidates.length ? <SecurityForm mode="transfer" candidates={details.candidates} /> : <p className="mt-4">{security.noCandidates}</p>}
      </section>}
  </>;
}
