// Server component: reusable vertical shell; compose later with approved page sections.
import type { ReactNode } from "react";
import Navigation from "@/components/layout/Navigation";
import Footer from "@/components/layout/Footer";
import type { FooterContent, NavigationContent } from "@/types/content";
export default function SiteLayout({ children, navigation, footer, embedded = false }: {
  children: ReactNode; navigation: NavigationContent; footer: FooterContent; embedded?: boolean;
}) {
  const Main = embedded ? "div" : "main";
  return <div data-site-layout className="flex min-h-screen min-w-0 flex-col pb-24 xl:pb-0">
    <Navigation content={navigation} />
    <Main id="main-content" data-site-main tabIndex={-1} className="min-w-0 flex-1 pt-32">{children}</Main>
    <Footer content={footer} />
  </div>;
}
