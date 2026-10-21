// Client control: collapse sidebar content and replace its logo with a restore icon.
"use client";
import { useContext } from "react";
import { WorkspaceContext } from "@/features/auth/workspace-context";
import { ADMIN_COPY } from "@/config/admin";
export default function WorkspaceSidebarToggle() {
  const { collapsed, toggle } = useContext(WorkspaceContext);
  const label = collapsed ? ADMIN_COPY.showSidebar : ADMIN_COPY.hideSidebar;
  return <button type="button" className="workspace-sidebar-toggle" onClick={toggle} aria-label={label} title={label}
    aria-expanded={!collapsed} aria-controls="workspace-navigation-sidebar">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <rect x="3" y="4" width="18" height="16" rx="2" /><path d="M9 4v16" /><path d={collapsed ? "m13 9 3 3-3 3" : "m16 9-3 3 3 3"} />
    </svg>
  </button>;
}
