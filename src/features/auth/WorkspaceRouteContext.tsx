// Client header context: update route labels while retaining server-rendered account actions.
"use client";
import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ADMIN_COPY, ADMIN_NAV } from "@/config/admin";
import { AUTH_COPY } from "@/config/auth";
export default function WorkspaceRouteContext({ organisationName, children }: { organisationName: string; children: ReactNode }) {
  const pathname = usePathname();
  const title = ADMIN_NAV.find(item => item.href === pathname)?.label ?? ADMIN_COPY.workspace;
  return <header className="workspace-header">
    <div className="workspace-header-leading"><div className="workspace-header-context"><nav aria-label={ADMIN_COPY.breadcrumb} className="workspace-breadcrumb">
      <Link href="/emcrown-admin" prefetch={false}>{AUTH_COPY.brand}</Link><span aria-hidden="true">/</span><span>{title}</span>
    </nav><p className="workspace-organisation">{organisationName}</p></div></div>
    <div className="workspace-header-actions">
      {pathname !== "/emcrown-admin" && <Link className="workspace-header-back" href="/emcrown-admin" prefetch={false}><span aria-hidden="true">←</span>{ADMIN_COPY.overview}</Link>}
      {children}
    </div>
  </header>;
}
