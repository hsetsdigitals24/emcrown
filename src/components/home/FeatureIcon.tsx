// Server-compatible line icons; decorative shapes carry no editable page copy.
const PATHS = {
  person: ["M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2", "M20 21v-2a4 4 0 0 0-3-3.87", "M16 3.13a4 4 0 0 1 0 7.75"],
  heart: ["M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"],
  calendar: ["M8 2v4M16 2v4M3 10h18", "M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z", "m9 16 2 2 4-4"],
  medical: ["M6 3v6a4 4 0 0 0 8 0V3", "M4 3h4M12 3h4", "M10 13v3a5 5 0 0 0 10 0v-3"],
  shield: ["m12 2 8 4v6c0 6-8 10-8 10S4 18 4 12V6l8-4Z", "m8 12 3 3 5-6"],
  pulse: ["M2 12h4l3-8 6 16 3-8h4"],
};
export type FeatureIconKind = keyof typeof PATHS;
export default function FeatureIcon({ kind }: { kind: FeatureIconKind }) {
  return <svg className="reference-feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {PATHS[kind].map((path, index) => <path d={path} key={index} />)}
    {kind === "person" && <circle cx="10" cy="7" r="4" />}
    {kind === "medical" && <circle cx="20" cy="11" r="2" />}
  </svg>;
}
