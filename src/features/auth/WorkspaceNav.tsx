// Client navigation: desktop links and an accessible modal drawer on mobile.
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import BrandLogo from "@/components/ui/BrandLogo";
import { ADMIN_COPY, ADMIN_NAV } from "@/config/admin";
import { hasPermission } from "@/config/auth";
import type { AdminRole } from "@/types/auth";
export default function WorkspaceNav({ role }: { role: AdminRole }) {
  const pathname = usePathname();
  const drawer = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const desktop = matchMedia("(min-width: 721px)");
    const closeOnDesktop = () => { if (desktop.matches) drawer.current?.close(); };
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, []);
  const close = () => drawer.current?.close();
  const links = ADMIN_NAV.filter(item => !item.permission || hasPermission(role, item.permission)).map(item => <Link
    key={item.href} href={item.href} prefetch={false} aria-current={pathname === item.href ? "page" : undefined} onClick={close}>
    <span aria-hidden="true">{item.icon}</span>{item.label}
  </Link>);
  const publicLink = <Link href="/" className="workspace-public" onClick={close}>{ADMIN_COPY.publicSite}</Link>;
  return <div className="workspace-navigation">
    <nav className="workspace-desktop-nav" aria-label={ADMIN_COPY.navigation}>{links}{publicLink}</nav>
    <button className="workspace-mobile-trigger" type="button" aria-haspopup="dialog" aria-expanded={open}
      aria-controls="workspace-mobile-drawer" onClick={() => { drawer.current?.showModal(); setOpen(true); }}>
      {ADMIN_COPY.navigation}<span aria-hidden="true">☰</span>
    </button>
    {/* Native modal provides focus containment, Escape dismissal and inert background. */}
    <dialog ref={drawer} id="workspace-mobile-drawer" className="workspace-mobile-drawer" aria-labelledby="workspace-drawer-title"
      onClose={() => setOpen(false)} onClick={event => { if (event.target === event.currentTarget) close(); }}>
      <div className="workspace-drawer-panel"><div className="workspace-drawer-heading"><BrandLogo />
        <h2 id="workspace-drawer-title">{ADMIN_COPY.navigation}</h2>
        <button type="button" autoFocus onClick={close} aria-label={ADMIN_COPY.closeMenu}>×</button>
      </div><nav aria-label={ADMIN_COPY.navigation}>{links}{publicLink}</nav></div>
    </dialog>
  </div>;
}
