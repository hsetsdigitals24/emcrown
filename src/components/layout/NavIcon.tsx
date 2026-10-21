// Server presentation: distinguish disclosure chevrons from destination arrows.
export default function NavIcon({ dropdown = false }: { dropdown?: boolean }) {
  return <svg className={dropdown ? "nav-icon nav-chevron" : "nav-icon"} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={dropdown ? "m6 9 6 6 6-6" : "M6 18 18 6M6 6h12v12"} />
  </svg>;
}
