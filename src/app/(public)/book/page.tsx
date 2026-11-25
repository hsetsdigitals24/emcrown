// Server route: published booking presentation around the established live booking service.
import BookingUnavailable from "@/features/booking/BookingUnavailable";
import { z } from "zod";
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
import { BOOKING_SEED, SITE_SEED } from "@/config/cms/content";
import { publishedContent } from "@/features/cms/public";
import { cmsMetadata } from "@/features/cms/metadata";
export async function generateMetadata() { return cmsMetadata("/book"); }
export default async function BookPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [content, site] = await Promise.all([publishedContent("/book", BOOKING_SEED), publishedContent("/_site", SITE_SEED)]);
  if (!liveBookingConfigured() || bookingReviewMode()) return <BookingUnavailable content={content} site={site} />;
  const query = await searchParams;
  const parsed = z.string().min(1).max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).safeParse(query.physician);
  const providers = (await publicPhysicians()).filter(provider => provider.bookingAvailable);
  const preferred = parsed.success ? providers.find(provider => provider.slug === parsed.data) : undefined;
  const selectionUnavailable = query.physician !== undefined && !preferred;
  const env = liveBookingEnv();
  const practice = await publishedPractice();
  const slots = await db().transaction(async tx => {
    const [org] = await tx.select({ id: organisations.id }).from(organisations).where(eq(organisations.key, "emcrown"));
    return org ? availableSlots(tx, org.id, practiceDate(new Date().toISOString(), BOOKING_SETTINGS.timeZone)) : [];
  });
  return <LiveBookingLayout copy={content.copy} reviewMode={false}><LiveBooking copy={content.copy} key={preferred?.id ?? "default"} initialPhysicianId={preferred?.id} selectionUnavailable={selectionUnavailable} providers={providers} initialSlots={slots} location={practice.locations[0]} reviewMode={false} siteKey={env.TURNSTILE_SITE_KEY} smsEnabled={env.smsEnabled} nonce={(await headers()).get("x-nonce") ?? undefined} /></LiveBookingLayout>;
}
