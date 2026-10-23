// Client recovery: keep workspace navigation available when a destination fails to load.
"use client";
import Link from "next/link";
import { AUTH_COPY } from "@/config/auth";
export default function WorkspaceError({ retry }: { retry: () => void }) {
  return <section className="workspace-panel" role="alert"><h1>{AUTH_COPY.errorTitle}</h1><p>{AUTH_COPY.genericError}</p>
    <div className="workspace-error-actions"><button type="button" className="admin-button" onClick={() => retry()}>{AUTH_COPY.retry}</button><Link href="/emcrown-admin" prefetch={false} className="workspace-text-link">{AUTH_COPY.home}</Link></div>
  </section>;
}
