// Server component: focused auth-page layout, independent of the full-width workspace.
import BrandLogo from "@/components/ui/BrandLogo";
import Link from "next/link";
import { AUTH_COPY } from "@/config/auth";
export default function AuthFrame({ children }: { children: React.ReactNode }) {
  return <div className="admin-auth-page"><Link href="/" className="admin-brand">
    <BrandLogo />{AUTH_COPY.brand}<span>{AUTH_COPY.eyebrow}</span></Link><section className="admin-card">{children}</section></div>;
}
