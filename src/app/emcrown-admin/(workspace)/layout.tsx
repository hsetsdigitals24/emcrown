// Server layout: persistent signed-in chrome; each page still authorizes its own data access.
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { authConfigured } from "@/lib/auth-env";
import { readSession, sessionDestination } from "@/features/auth/session";
import WorkspaceShell from "@/features/auth/WorkspaceShell";
import { AUTH_COPY } from "@/config/auth";
export default async function WorkspaceLayout({ children }: { children: ReactNode }) {
  if (!authConfigured()) return <section className="admin-card"><h1>{AUTH_COPY.title}</h1><p>{AUTH_COPY.unavailable}</p></section>;
  const session = await readSession();
  if (!session) redirect("/emcrown-admin/login");
  if (session.stage !== "full") redirect(sessionDestination(session.stage));
  // Never pass the session itself: only safe account context belongs in the shell.
  return <WorkspaceShell actor={{ role: session.role, organisationName: session.organisationName }}>{children}</WorkspaceShell>;
}
