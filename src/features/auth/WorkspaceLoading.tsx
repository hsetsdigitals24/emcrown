// Server fallback: contain navigation feedback within the persistent workspace content area.
import BrandLogo from "@/components/ui/BrandLogo";
import { ADMIN_COPY } from "@/config/admin";
export default function WorkspaceLoading() {
  return <div className="workspace-route-loading" role="status" aria-live="polite"><div className="workspace-loading-logo" aria-hidden="true"><BrandLogo /></div><p>{ADMIN_COPY.loadingPage}</p></div>;
}
