// Server component: publish structured data only after content approval; serialize safely.
import { serializeStructuredData } from "@/lib/structured-data";
export default function StructuredData({ data, enabled }: { data: Record<string, unknown>; enabled: boolean }) {
  if (!enabled) return null;
  const sanitized = serializeStructuredData(data);
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: sanitized }} />;
}
