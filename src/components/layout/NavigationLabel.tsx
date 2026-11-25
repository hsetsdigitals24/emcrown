// Server component: two visual text layers crossfade from the same CMS label.
export default function NavigationLabel({ label }: { label: string }) {
  return <span className="navigation-label" data-label={label}><span className="navigation-label-default">{label}</span></span>;
}
