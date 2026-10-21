"use client";
// Client island: refresh server-checked eligibility after an invited account enrolls MFA.
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { HANDOVER_COPY } from "@/config/handover";
export default function SecurityRefresh() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return <button className="workspace-text-link" type="button" disabled={pending}
    onClick={() => startTransition(() => router.refresh())}>{pending ? HANDOVER_COPY.pending : HANDOVER_COPY.refresh} ↻</button>;
}
