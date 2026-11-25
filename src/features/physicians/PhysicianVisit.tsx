// Server component: published practice details beside the physician's record.
import Button from "@/components/ui/Button";
import { CLINICAL_COPY as copy } from "@/config/clinical";
import type { SITE_SEED } from "@/config/cms/content";

export default function PhysicianVisit({ site }: { site: typeof SITE_SEED }) {
  const location = site.practice.locations[0];
  return <section id="physician-visit" className="profile-visit" aria-labelledby="profile-visit-heading">
    <div className="profile-visit-heading"><h2 id="profile-visit-heading">{copy.profileVisit}</h2><p>{copy.profileVisitHelp}</p></div>
    <div className="profile-visit-details">
      <div><h3>{site.footer.practiceName}</h3><address>{location.address}</address><p>{location.hours}</p>
        <a className="profile-directions" href={location.directions.href}>{location.directions.label}<span aria-hidden="true">↗</span></a>
      </div>
      <div className="profile-contact"><p>{copy.profileContact}</p><a href={site.practice.phone.href}>{site.practice.phone.label}</a>
        <Button href="/contact">{copy.profileContactLink}</Button>
      </div>
    </div>
  </section>;
}
