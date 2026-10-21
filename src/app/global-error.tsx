// Client boundary: root-layout failures need their own document and recovery UI.
"use client";
import "@/app/globals.css";
import ErrorFallback from "@/components/recovery/ErrorFallback";
export default function GlobalError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return <html lang="en"><body><main id="main-content"><ErrorFallback retry={retry} /></main></body></html>;
}
