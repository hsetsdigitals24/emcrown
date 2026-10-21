// Client autosave: debounce edits, serialize with manual actions, retry transient failures.
"use client";
import { useEffect, useRef, useState } from "react";
import { CMS_COPY, CMS_POLICY } from "@/config/cms/copy";
import { useToast } from "@/components/ui/ToastProvider";
export function useAutosave({ content, dirty, busy, blocked, retry, save }: {
  content: string; dirty: boolean; busy: boolean; blocked: boolean; retry: boolean; save: () => Promise<void>;
}) {
  const action = useRef(save);
  const [online, setOnline] = useState(true);
  const notify = useToast();
  useEffect(() => { action.current = save; });
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update); window.addEventListener("offline", update);
    return () => { window.removeEventListener("online", update); window.removeEventListener("offline", update); };
  }, []);
  useEffect(() => { if (!online && dirty) notify(CMS_COPY.offline); }, [online, dirty, notify]);
  useEffect(() => {
    if (!dirty || busy || blocked || !online) return;
    const timer = window.setTimeout(() => { void action.current(); }, retry ? CMS_POLICY.autosaveRetry : CMS_POLICY.autosaveDelay);
    return () => window.clearTimeout(timer);
  }, [content, dirty, busy, blocked, retry, online]);
}
