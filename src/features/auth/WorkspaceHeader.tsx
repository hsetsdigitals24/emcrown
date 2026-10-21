// Server component: useful workspace context, overview navigation and session actions.
import Link from "next/link";
import { AUTH_COPY } from "@/config/auth";
import { ADMIN_COPY } from "@/config/admin";
import { logoutAction } from "@/features/auth/actions";
export default function WorkspaceHeader({ title, organisationName, role, overview }: {
  title: string; organisationName: string; role: string; overview: boolean;
}) {
  return <header className="workspace-header">
    <div className="workspace-header-leading"><div className="workspace-header-context"><nav aria-label={ADMIN_COPY.breadcrumb} className="workspace-breadcrumb">
      <Link href="/emcrown-admin" prefetch={false}>{AUTH_COPY.brand}</Link><span aria-hidden="true">/</span><span>{title}</span>
    </nav><p className="workspace-organisation">{organisationName}</p></div></div>
    <div className="workspace-header-actions">
      {!overview && <Link className="workspace-header-back" href="/emcrown-admin" prefetch={false}><span aria-hidden="true">←</span>{ADMIN_COPY.overview}</Link>}
      <span className="workspace-session"><span className="workspace-role-dot" aria-hidden="true" />{role.replaceAll("_", " ")}</span>
      <form action={logoutAction}><button className="admin-button admin-signout" type="submit">{AUTH_COPY.logout}</button></form>
    </div>
  </header>;
}
