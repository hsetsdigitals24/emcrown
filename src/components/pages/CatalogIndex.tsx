// Server component: compose index hero and reusable catalog grid without client fetching.
import PageFrame from "@/components/pages/PageFrame";
import CatalogGrid from "@/components/pages/CatalogGrid";
import Container from "@/components/layout/Container";
import type { PageContent, PublicEntry } from "@/types/public";
export default function CatalogIndex({ content, entries, actionLabel, images, portraits, serviceMotion = false }: {
  content: PageContent; entries: PublicEntry[]; actionLabel: string; images?: boolean; portraits?: boolean; serviceMotion?: boolean;
}) {
  return <PageFrame content={content} enhancedMotion={serviceMotion}><div className="home-section"><Container>
    <CatalogGrid entries={entries} actionLabel={actionLabel} images={images} portraits={portraits} serviceMotion={serviceMotion} />
  </Container></div></PageFrame>;
}
