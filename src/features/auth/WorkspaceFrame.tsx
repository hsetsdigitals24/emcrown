// Client frame: collapse navigation while keeping server-rendered sidebar and page slots.
"use client";
import { useState, type ReactNode } from "react";
import { WorkspaceContext } from "@/features/auth/workspace-context";
export default function WorkspaceFrame({ sidebar, children }: { sidebar: ReactNode; children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  return <WorkspaceContext.Provider value={{ collapsed, toggle: () => setCollapsed(value => !value) }}>
    <div className="admin-workspace" data-sidebar-collapsed={collapsed}>{sidebar}{children}</div>
  </WorkspaceContext.Provider>;
}
