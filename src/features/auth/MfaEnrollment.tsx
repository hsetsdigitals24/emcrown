// Server component: show a private setup QR when available, with a manual-key fallback.
import Image from "next/image";
import { AUTH_COPY } from "@/config/auth";
export default function MfaEnrollment({ setupKey, qrDataUrl }: { setupKey: string; qrDataUrl?: string }) {
  return <div className="rounded-control border border-border bg-surfaceTint p-4">
    <p>{qrDataUrl ? AUTH_COPY.enrollQrHelp : AUTH_COPY.enrollHelp}</p>
    {qrDataUrl && <Image src={qrDataUrl} alt={AUTH_COPY.enrollQrAlt} width={320} height={320}
      unoptimized className="mx-auto my-4 h-auto max-w-full rounded-control" />}
    {qrDataUrl ? <details><summary className="cursor-pointer text-primary">{AUTH_COPY.enrollManual}</summary>
      <code className="mt-3 block break-all select-all">{setupKey}</code></details>
      : <code className="mt-3 block break-all select-all">{setupKey}</code>}
    <p className="mt-3 text-sm text-textSecondary">{AUTH_COPY.enrollPrivate}</p>
  </div>;
}
