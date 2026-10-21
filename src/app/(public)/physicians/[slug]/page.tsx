// Server detail: approved database profiles take precedence; existing CMS placeholders remain available.
import { physicianName } from "@/lib/physician-name";
import { notFound } from "next/navigation";
import PublishedPage from "@/features/cms/PublishedPage";
import { cmsMetadata } from "@/features/cms/metadata";
import { PHYSICIAN_ENTRIES } from "@/config/cms/content";
import { findDefinition } from "@/config/cms/registry";
import { publicPhysicians } from "@/features/physicians/repository";
import { PublicPhysicianDetail } from "@/features/physicians/PublicPhysicians";
import { SITE_SETTINGS } from "@/config/practice";
import "@/features/clinical/styles.css";
type Props = { params: Promise<{ slug: string }> };
export function generateStaticParams() { return PHYSICIAN_ENTRIES.map(entry => ({ slug: entry.slug })); }
export async function generateMetadata({ params }: Props) {
  const { slug } = await params; const record = (await publicPhysicians()).find(item => item.slug === slug);
  if (!record) { const path = `/physicians/${slug}`; if (!findDefinition(path)) notFound(); return cmsMetadata(path); }
  const description = record.bio.slice(0, 160); const canonical = `${SITE_SETTINGS.url}/physicians/${record.slug}`;
  return { title: `${physicianName(record)} | Emcrown`, description, alternates: { canonical }, openGraph: { title: physicianName(record), description, url: canonical } };
}
export default async function DetailPage({ params }: Props) {
  const { slug } = await params; const record = (await publicPhysicians()).find(item => item.slug === slug);
  if (record) return <PublicPhysicianDetail record={record} />;
  const path = `/physicians/${slug}`; if (!findDefinition(path)) notFound();
  return <PublishedPage path={path} />;
}
