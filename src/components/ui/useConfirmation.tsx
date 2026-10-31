// Client confirmation: native modal focus management with explicit action labels and colours.
"use client";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { ADMIN_COPY } from "@/config/admin";
type Confirmation = { title: string; description: string; label: string; intent: "success" | "danger" | "caution" };
function ConfirmationDialog({ request, onAnswer }: { request: Confirmation; onAnswer: (accepted: boolean) => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId(); const descriptionId = useId();
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, []);
  return <dialog ref={dialog} className="admin-confirm" aria-labelledby={titleId} aria-describedby={descriptionId}
    onCancel={event => { event.preventDefault(); onAnswer(false); }}>
    <h2 id={titleId}>{request.title}</h2><p id={descriptionId}>{request.description}</p>
    <div className="admin-confirm-actions">
      <button autoFocus type="button" data-intent="secondary" onClick={() => onAnswer(false)}>{ADMIN_COPY.dismissConfirmation}</button>
      <button type="button" data-intent={request.intent} onClick={() => onAnswer(true)}>{request.label}</button>
    </div>
  </dialog>;
}
export function useConfirmation() {
  const [request, setRequest] = useState<Confirmation>();
  const resolver = useRef<((accepted: boolean) => void) | undefined>(undefined);
  useEffect(() => () => { resolver.current?.(false); }, []);
  const confirm = useCallback((options: Confirmation) => new Promise<boolean>(resolve => {
    // Ignore duplicate triggers while the current choice is pending.
    if (resolver.current) { resolve(false); return; }
    resolver.current = resolve; setRequest(options);
  }), []);
  const answer = useCallback((accepted: boolean) => {
    const resolve = resolver.current;
    resolver.current = undefined; setRequest(undefined); resolve?.(accepted);
  }, []);
  return { confirm, confirmation: request ? <ConfirmationDialog request={request} onAnswer={answer} /> : null };
}
