// Server layout: marketing chrome stays outside the private organisation workspace.
import { practiceFooter } from "@/lib/practice";
import { physicianName } from "@/lib/physician-name";
import { publicPhysicianPreview } from "@/features/physicians/public-preview";
import SiteLayout from "@/components/layout/SiteLayout";
import { SITE_SEED } from "@/config/cms/content";
import { publishedContent, publicValues } from "@/features/cms/public";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { findDefinition } from "@/config/cms/registry";
export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  // A layout guard runs before the page loading boundary can stream a 200 response.
  const path = (await headers()).get("x-emcrown-content-path");
  if (path && findDefinition(path) && await publicValues(path) === null) notFound();
  const site = await publishedContent("/_site", SITE_SEED);
  const footer = practiceFooter(site.footer, site.practice);
  const physicians = await publicPhysicianPreview();
  const navigation = physicians === null ? { ...site.navigation, items: site.navigation.items.map(item => item.href === "/physicians" ? { ...item, previews: [] } : item) } : physicians.length ? { ...site.navigation, items: site.navigation.items.map(item => item.href === "/physicians" ? { ...item, previews: physicians.map(record => ({ label: physicianName(record), photo: record.photo, href: `/physicians/${record.slug}`, description: record.specialties })) } : item) } : site.navigation;
  return <SiteLayout navigation={navigation} footer={footer}>{children}</SiteLayout>;
}
