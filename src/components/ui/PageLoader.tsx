// Server-compatible loading screen shared by route and Suspense fallbacks.
import BrandLogo from "@/components/ui/BrandLogo";
export default function PageLoader({ label }: { label: string }) {
  return <div className="page-loader" role="status" aria-live="polite"><div className="page-loader-mark"><BrandLogo /></div><p>{label}</p></div>;
}
