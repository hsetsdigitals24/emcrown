// Server component: native location disclosure selector works without JavaScript.
import PracticeMap from "@/components/ui/PracticeMap";
import { singlePractice } from "@/lib/practice";
import type { PracticeConfig, PracticeLocation } from "@/types/public";
import { CONTACT_COPY as DEFAULT_COPY } from "@/config/pages/contact";
function LocationDetails({ location, copy: CONTACT_COPY }: { location: PracticeLocation; copy: typeof DEFAULT_COPY }) {
  return <div className="public-location-layout"><PracticeMap address={location.address} label={location.mapLabel} />
    <div className="location-details"><address>{location.address}</address><dl className="space-y-4">
      <div><dt>{CONTACT_COPY.hours}</dt><dd>{location.hours}</dd></div>
      <div><dt>{CONTACT_COPY.parking}</dt><dd>{location.parking}</dd></div>
      <div><dt>{CONTACT_COPY.accessibility}</dt><dd>{location.accessibility}</dd></div>
    </dl><a className="inline-flex min-h-target items-center gap-3 text-primary" href={location.directions.href}>{location.directions.label}<span aria-hidden="true">↗</span></a></div>
  </div>;
}
export default function PracticeLocations({ practice, copy: CONTACT_COPY = DEFAULT_COPY }: { practice: PracticeConfig; copy?: typeof DEFAULT_COPY }) {
  const locations = singlePractice(practice).locations;
  return <section aria-labelledby="locations-heading"><h2 id="locations-heading" className="font-heading text-heading font-light text-primary">{CONTACT_COPY.location}</h2>
    {practice.locationSelectorEnabled && <p className="mt-4 text-textSecondary">{CONTACT_COPY.locationSelector}</p>}
    <div className="mt-6 space-y-4">{locations.map((location, index) => practice.locationSelectorEnabled ?
      <details className="location-disclosure" key={location.id} name="practice-location" open={index === 0}>
        <summary>{location.label}</summary><LocationDetails location={location} copy={CONTACT_COPY} />
      </details> : <LocationDetails key={location.id} location={location} copy={CONTACT_COPY} />)}</div>
  </section>;
}
