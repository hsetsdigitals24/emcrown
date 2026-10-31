// Server header: retain account actions while a small client island follows the current route.
import { AUTH_COPY } from "@/config/auth";
import { logoutAction } from "@/features/auth/actions";
import WorkspaceRouteContext from "@/features/auth/WorkspaceRouteContext";
export default function WorkspaceHeader({ organisationName, role }: { organisationName: string; role: string }) {
  return <WorkspaceRouteContext organisationName={organisationName}>
    <span className="workspace-session"><span className="workspace-role-dot" aria-hidden="true" />{role.replaceAll("_", " ")}</span>
    <form action={logoutAction}><button data-intent="secondary" className="admin-button admin-signout" type="submit">{AUTH_COPY.logout}</button></form>
  </WorkspaceRouteContext>;
}
