// Shared rendering: public server output and private client preview reuse identical sections.
import { physicianName } from "@/lib/physician-name";
import type { PublicPhysician } from "@/types/clinical";
import { CLINICAL_COPY } from "@/config/clinical";
import HomeMotion from "@/components/motion/HomeMotion";
import Hero from "@/components/home/Hero";
import Principles from "@/components/home/Principles";
import Services from "@/components/home/Services";
import BookingSteps from "@/components/home/BookingSteps";
import Physicians from "@/components/home/Physicians";
import Testimonials from "@/components/home/Testimonials";
import Location from "@/components/home/Location";
import Faq from "@/components/home/Faq";
import Closing from "@/components/home/Closing";
import { HOME_SEED } from "@/config/cms/content";
export default function HomeContent({ content, preview = false, records = [] }: { content: typeof HOME_SEED; preview?: boolean; records?: PublicPhysician[] | null }) {
  const physicianContent = records?.length ? { ...content.physicians, isMock: false, physicians: records.slice(0, 3).map(record => ({ id: record.id, name: physicianName(record),
    specialty: record.specialties, photo: record.photo, photoLabel: CLINICAL_COPY.photoPlaceholder, link: { label: CLINICAL_COPY.profile, href: `/physicians/${record.slug}` } })) } : content.physicians;
  const sections = <><Hero content={content.hero} /><Principles content={content.principles} />
    <Services content={content.services} /><BookingSteps content={content.booking} /><Physicians content={physicianContent} unavailable={records === null} />
    <Testimonials content={content.testimonials} /><Location content={content.location} /><Faq content={content.faq} /><Closing content={content.closing} /></>;
  return preview ? <div className="cms-site-preview">{sections}</div> : <HomeMotion>{sections}</HomeMotion>;
}
