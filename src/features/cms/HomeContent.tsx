// Shared rendering: public server output and private client preview reuse identical sections.
import { physicianName } from "@/lib/physician-name";
import type { PublicPhysician } from "@/types/clinical";
import Insurance from "@/components/home/Insurance";
import HomeMotion from "@/components/motion/HomeMotion";
import Hero from "@/components/home/Hero";
import Principles from "@/components/home/Principles";
import About from "@/components/home/About";
import Services from "@/components/home/Services";
import Physicians from "@/components/home/Physicians";
import Testimonials from "@/components/home/Testimonials";
import Location from "@/components/home/Location";
import Closing from "@/components/home/Closing";
import type { HOME_SEED } from "@/config/cms/content";
export default function HomeContent({ content, preview = false, records = [], insuranceAvailable = true }: { content: typeof HOME_SEED; preview?: boolean; records?: PublicPhysician[] | null; insuranceAvailable?: boolean }) {
  const physicianContent = records?.length ? { ...content.physicians, isMock: false, physicians: records.slice(0, 3).map(record => ({ id: record.id, name: physicianName(record),
    booking: record.bookingAvailable ? { label: content.physicians.labels.book, href: `/book?physician=${encodeURIComponent(record.slug)}` } : undefined,
    specialty: record.specialties, photo: record.photo, photoLabel: physicianName(record), link: { label: content.physicians.labels.profile, href: `/physicians/${record.slug}` } })) } : { ...content.physicians, physicians: [] };
  const sections = <div className="reference-home" data-homepage><Hero content={content.hero} /><Principles content={content.principles} />
    <About content={content.about} /><Services content={content.services} /><Physicians content={physicianContent} unavailable={records === null} />
    <Testimonials content={content.testimonials} />{insuranceAvailable && <Insurance content={content.insurance} />}<Location content={content.location} /><Closing content={content.closing} /></div>;
  return preview ? <div className="cms-site-preview">{sections}</div> : <HomeMotion>{sections}</HomeMotion>;
}
