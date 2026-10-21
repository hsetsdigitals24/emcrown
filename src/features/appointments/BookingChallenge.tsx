// Client bot challenge: load only in explicitly enabled live booking; tokens remain in tab memory.
"use client";
import { useEffect, useRef, useState } from "react";
import Script from "next/script";
type Turnstile = { render: (target: HTMLElement, options: { sitekey: string; action: string; callback: (token: string) => void; "expired-callback": () => void; "error-callback": () => void }) => string; remove: (id: string) => void };
export default function BookingChallenge({ siteKey, nonce, onToken }: { siteKey: string; nonce?: string; onToken: (token: string) => void }) {
  const ref = useRef<HTMLDivElement>(null); const [ready, setReady] = useState(false);
  const callback = useRef(onToken); useEffect(() => { callback.current = onToken; });
  useEffect(() => {
    if (!ready || !ref.current) return;
    const widget = (window as unknown as { turnstile?: Turnstile }).turnstile;
    if (!widget) return;
    const id = widget.render(ref.current, { sitekey: siteKey, action: "booking", callback: token => callback.current(token),
      "expired-callback": () => callback.current(""), "error-callback": () => callback.current("") });
    return () => { widget.remove(id); callback.current(""); };
  }, [ready, siteKey]);
  return <><Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" nonce={nonce} onReady={() => setReady(true)} /><div ref={ref} /></>;
}
