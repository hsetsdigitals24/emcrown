// Server-compatible decorative icons shared by the contact strip and footer.
export default function ContactIcon({ kind }: { kind: "location" | "phone" | "fax" | "clock" }) {
  return <svg className="footer-contact-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {kind === "location" && <><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>}
    {kind === "phone" && <path d="m7 3 3 5-3 3a17 17 0 0 0 6 6l3-3 5 3-1 4C10 23 1 14 3 4Z" />}
    {kind === "fax" && <><path d="M6 9V3h12v6M6 17H3V9h18v8h-3M6 14h12v7H6Z" /><path d="M17 11h1" /></>}
    {kind === "clock" && <><circle cx="12" cy="12" r="9" /><path d="M12 6v6l4 2" /></>}
  </svg>;
}
