// Client hook: prevent accidental loss on browser navigation; store no drafts in browser storage.
"use client";
import { useEffect } from "react";
import { CMS_COPY } from "@/config/cms/copy";
export function useUnsavedChanges(dirty: boolean, message: string = CMS_COPY.leave) {
  useEffect(() => {
    if (!dirty) return;
    const unload = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    const click = (event: MouseEvent) => {
      const link = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (link && !window.confirm(message)) { event.preventDefault(); event.stopPropagation(); }
    };
    window.addEventListener("beforeunload", unload);
    document.addEventListener("click", click, true);
    const submit = (event: SubmitEvent) => {
      if (event.target instanceof Element && event.target.closest(".workspace-header-actions") && !window.confirm(message)) {
        event.preventDefault(); event.stopPropagation();
      }
    };
    document.addEventListener("submit", submit, true);
    return () => { window.removeEventListener("beforeunload", unload); document.removeEventListener("click", click, true); document.removeEventListener("submit", submit, true); };
  }, [dirty, message]);
}
