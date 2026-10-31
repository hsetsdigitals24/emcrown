// Server layout: admin-only metadata and independent workspace styling.
import ToastProvider from "@/components/ui/ToastProvider";
import { connection } from "next/server";
import type { Metadata } from "next";
import { AUTH_COPY } from "@/config/auth";
import "@/app/emcrown-admin/styles.css";
import "@/app/emcrown-admin/buttons.css";
export const metadata: Metadata = {
  title: "Staff workspace | Emcrown", description: "Authorised Emcrown organisation workspace.",
  robots: { index: false, follow: false, nocache: true },
};
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Every admin response needs request-specific script nonces, including recovery pages.
  await connection();
  return <ToastProvider><div className="admin-shell"><a href="#admin-content" className="skip-link">{AUTH_COPY.home}</a>
    <main id="admin-content" tabIndex={-1}>{children}</main></div></ToastProvider>;
}
