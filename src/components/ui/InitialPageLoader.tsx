// Client island: cover initial resource preparation, with a bounded fail-open timeout.
"use client";
import { useEffect, useState } from "react";
import PageLoader from "@/components/ui/PageLoader";
import { BRAND, PAGE_READY_EVENT } from "@/config/brand";
export default function InitialPageLoader({ label }: { label: string }) {
  const [complete, setComplete] = useState(false);
  useEffect(() => {
    let mounted = true;
    const finish = () => { if (mounted) setComplete(true); };
    let onLoad = () => {};
    const loaded = new Promise<void>(resolve => {
      onLoad = () => resolve();
      if (document.readyState === "complete") resolve();
      else window.addEventListener("load", onLoad, { once: true });
    });
    const timeout = window.setTimeout(finish, BRAND.loadingTimeoutMs);
    void Promise.allSettled([loaded, document.fonts.ready]).then(finish);
    return () => { mounted = false; window.clearTimeout(timeout); window.removeEventListener("load", onLoad); };
  }, []);
  useEffect(() => {
    if (complete) window.dispatchEvent(new Event(PAGE_READY_EVENT));
  }, [complete]);
  return complete ? null : <div className="initial-page-loader"><PageLoader label={label} /></div>;
}
