// Server workspace shell: shared navigation and account context for every admin feature.
import BrandLogo from "@/components/ui/BrandLogo";
import type { ReactNode } from "react";
import WorkspaceNav from "@/features/auth/WorkspaceNav";
import WorkspaceHeader from "@/features/auth/WorkspaceHeader";
import { AUTH_COPY } from "@/config/auth";
import { ADMIN_COPY } from "@/config/admin";
import type { AdminRole } from "@/types/auth";
import WorkspaceFrame from "@/features/auth/WorkspaceFrame";
import WorkspaceSidebarToggle from "@/features/auth/WorkspaceSidebarToggle";
export default function WorkspaceShell({ actor, children }: {
  actor: { role: AdminRole; organisationName: string }; children: ReactNode;
}) {
  const sidebar = <aside className="workspace-sidebar"><div className="workspace-sidebar-brand"><div className="workspace-monogram"><BrandLogo /></div><WorkspaceSidebarToggle /></div>
    <div id="workspace-navigation-sidebar" className="workspace-sidebar-content">
      <p className="workspace-sidebar-name">{AUTH_COPY.brand}<span>{ADMIN_COPY.workspace}</span></p>
      <WorkspaceNav role={actor.role} /><div className="workspace-role"><span className="workspace-role-dot" />{actor.role.replaceAll("_", " ")}</div>
    </div>
    </aside>;
  return <WorkspaceFrame sidebar={sidebar}><div className="workspace-main"><WorkspaceHeader organisationName={actor.organisationName} role={actor.role} />
      <div className="workspace-content">{children}</div>
    </div>
  </WorkspaceFrame>;
}
