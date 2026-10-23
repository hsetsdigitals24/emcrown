// Server component: embed only the public practice address, without sending the page referrer.
export default function PracticeMap({ address, label }: { address: string; label: string }) {
  const source = new URL("https://www.google.com/maps");
  source.searchParams.set("q", address);
  source.searchParams.set("output", "embed");
  return <div className="practice-map">
    <iframe title={label} src={source.toString()} width="640" height="440"
      loading="lazy" referrerPolicy="no-referrer" allowFullScreen />
  </div>;
}
