// Server page wrapper: route-specific heading and content inside persistent workspace chrome.
import type { ReactNode } from "react";
import { ADMIN_COPY } from "@/config/admin";
export default function WorkspacePage({ title, children }: { title: string; children: ReactNode }) {
  return <><div className="workspace-page-heading"><p className="workspace-eyebrow">{ADMIN_COPY.workspace}</p><h1>{title}</h1></div>{children}</>;
}
