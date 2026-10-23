// Server component: native disclosure navigation works with keyboard and without JS.
import "@/components/layout/navigation.css";
import BrandLogo from "@/components/ui/BrandLogo";
import Image from "next/image";
import { NAVIGATION_COPY } from "@/config/site-shell";
import Link from "next/link";
import NavIcon from "@/components/layout/NavIcon";
import NavigationBookingLink from "@/components/layout/NavigationBookingLink";
import NavigationShadow from "@/components/layout/NavigationShadow";
import type { NavigationContent } from "@/types/content";
export default function Navigation({ content }: { content: NavigationContent }) {
  return <>
    <a href="#main-content" className="skip-link">{content.skipLabel}</a>
    <NavigationShadow><nav aria-label={content.label} className="navigation-pill" data-cms-group="navigation">
      <Link href={content.brand.href} className="brand-link"><BrandLogo />{content.brand.label}</Link>
      <ul className="hidden items-center gap-2 xl:flex">
        {content.items.map((item) => <li key={item.href} className="relative">
          {item.previews?.length ? <details className="navigation-disclosure">
            <summary className="navigation-link cursor-pointer">{item.label}<NavIcon dropdown /></summary>
            <div className="navigation-preview">
              <Link href={item.href} className="navigation-link">{NAVIGATION_COPY.viewAll}</Link>
              {item.previews.map((preview, index) => <Link key={`${preview.href}-${index}`} href={preview.href} className="navigation-preview-card block rounded-card bg-surfaceTint p-4 text-primary">
                {preview.photo && <Image src={preview.photo} alt="" width={64} height={72} className="navigation-physician-photo" unoptimized referrerPolicy="no-referrer" />}<span className="navigation-preview-copy"><span>{preview.label}</span><span className="text-sm text-textSecondary">{preview.description}</span></span>
              </Link>)}
            </div>
          </details> : <Link className="navigation-link" href={item.href}>{item.label}<NavIcon /></Link>}
        </li>)}
      </ul>
      <div className="hidden xl:block"><NavigationBookingLink link={content.booking} /></div>
      <details className="navigation-mobile xl:hidden">
        <summary className="navigation-link hamburger-toggle cursor-pointer" aria-label={content.menuLabel}><span className="hamburger-icon" aria-hidden="true"><span /><span /><span /></span><span className="sr-only">{content.menuLabel}</span></summary>
        <div className="menu-backdrop" aria-hidden="true" />
        <ul className="navigation-mobile-panel">{content.items.map((item) => <li key={item.href}>
          {item.previews?.length ? <details className="mobile-submenu">
            <summary className="navigation-link">{item.label}<NavIcon dropdown /></summary>
            <div className="mobile-submenu-links"><Link className="navigation-link" href={item.href}>{NAVIGATION_COPY.viewAll}</Link>
              {item.previews.map((preview) => <Link key={preview.href} className="navigation-link" href={preview.href}>{preview.photo && <Image src={preview.photo} alt="" width={48} height={56} className="navigation-physician-photo" unoptimized referrerPolicy="no-referrer" />}<span>{preview.label}</span></Link>)}
            </div>
          </details> : <Link className="navigation-link" href={item.href}>{item.label}<NavIcon /></Link>}
        </li>)}</ul>
      </details>
    </nav></NavigationShadow>
    <div data-cms-group="navigation" className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-center gap-4 border-t border-border bg-background p-4 pb-[max(1rem,env(safe-area-inset-bottom))] xl:hidden">
      <NavigationBookingLink link={content.booking} />
    </div>
  </>;
}
