// Client boundary: Next.js requires client error files, with retry rather than reset.
"use client";
import ErrorFallback from "@/components/recovery/ErrorFallback";
export default function PageError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return <ErrorFallback retry={retry} />;
}
