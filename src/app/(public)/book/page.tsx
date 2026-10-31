// Server route: published editorial content; demo availability stays public and contact state stays local.
import { z } from "zod";
import { physicianName } from "@/lib/physician-name";
import { makeMockSchedule } from "@/features/booking/schedule";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { organisations } from "@/lib/db/schema";
import { bookingReviewMode } from "@/features/clinical/review";
import { liveBookingConfigured, liveBookingEnv } from "@/features/clinical/env";
import { publicPhysicians } from "@/features/physicians/repository";
import { availableSlots } from "@/features/appointments/availability";
import { practiceDate } from "@/features/booking/time";
import { BOOKING_SETTINGS } from "@/config/booking";
import { publishedPractice } from "@/features/clinical/practice";
import LiveBookingLayout from "@/features/appointments/LiveBookingLayout";
import LiveBooking from "@/features/appointments/LiveBooking";
import "@/features/clinical/styles.css";
import BookingContent from "@/features/cms/BookingContent";
import { BOOKING_SEED, SITE_SEED } from "@/config/cms/content";
import { publishedContent } from "@/features/cms/public";
import { cmsMetadata } from "@/features/cms/metadata";
import { getDemoSchedule } from "@/features/booking/demo-data";
export async function generateMetadata() { return cmsMetadata("/book"); }
export default async function BookPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams;
  const parsed = z.string().min(1).max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).safeParse(query.physician);
  const providers = (await publicPhysicians()).filter(provider => provider.bookingAvailable);
  const preferred = parsed.success ? providers.find(provider => provider.slug === parsed.data) : undefined;
  const selectionUnavailable = query.physician !== undefined && !preferred;
  if (liveBookingConfigured()) {
    const env = liveBookingEnv();
    const practice = await publishedPractice();
    const slots = await db().transaction(async tx => {
      const [org] = await tx.select({ id: organisations.id }).from(organisations).where(eq(organisations.key, "emcrown"));
      return org ? availableSlots(tx, org.id, practiceDate(new Date().toISOString(), BOOKING_SETTINGS.timeZone)) : [];
    });
    return <LiveBookingLayout reviewMode={bookingReviewMode()}><LiveBooking key={preferred?.id ?? "default"} initialPhysicianId={preferred?.id} selectionUnavailable={selectionUnavailable} providers={providers} initialSlots={slots} location={practice.locations[0]} reviewMode={bookingReviewMode()} siteKey={env.TURNSTILE_SITE_KEY} smsEnabled={env.smsEnabled} nonce={(await headers()).get("x-nonce") ?? undefined} /></LiveBookingLayout>;
  }
  const [content, site, schedule] = await Promise.all([publishedContent("/book", BOOKING_SEED), publishedContent("/_site", SITE_SEED), getDemoSchedule()]);
  // Only this explicitly labelled demo invents sample slots; live availability stays database-backed.
  const demoProviders = providers.map(provider => ({ id: provider.id, label: physicianName(provider), specialty: provider.specialties }));
  const demoContent = { ...content, providers: demoProviders,
    appointmentTypes: content.appointmentTypes.map(type => ({ ...type, providerIds: demoProviders.map(provider => provider.id) })) };
  // Published provider/location IDs must match the sample slots, including without a physician deep link.
  const demoSchedule = makeMockSchedule(schedule.referenceUtc, { ...BOOKING_SETTINGS, providers: demoContent.providers, types: demoContent.appointmentTypes }, site.practice.locations.slice(0, 1).map(location => location.id));
  return <BookingContent content={demoContent} site={site} schedule={demoSchedule} initialProviderId={preferred?.id} selectionUnavailable={selectionUnavailable} />;
}
