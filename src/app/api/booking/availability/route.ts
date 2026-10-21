// Server public availability: only approved physicians and open time slots, never patient details.
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { organisations } from "@/lib/db/schema";
import { dateSchema } from "@/features/clinical/validation";
import { clinicalJson } from "@/features/clinical/http";
import { liveBookingConfigured } from "@/features/clinical/env";
import { publicBookingAllowed } from "@/features/appointments/public-http";
import { availableSlots } from "@/features/appointments/availability";
import { CLINICAL_POLICY } from "@/config/clinical";
export async function GET(request: Request) {
  try {
    if (!liveBookingConfigured()) return clinicalJson({ ok: false, code: "unavailable" }, 503);
    if (!await publicBookingAllowed(request, "availability")) return clinicalJson({ ok: false, code: "denied" }, 429);
    const query = z.object({ from: dateSchema }).strict().safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!query.success || Math.abs(Date.parse(query.data.from) - Date.now()) > CLINICAL_POLICY.horizonDays * 86400000) return clinicalJson({ ok: false, code: "invalid" }, 400);
    const result = await db().transaction(async tx => {
      const [org] = await tx.select({ id: organisations.id }).from(organisations).where(eq(organisations.key, "emcrown"));
      return org ? availableSlots(tx, org.id, query.data.from) : [];
    });
    return clinicalJson({ ok: true, data: result });
  } catch { return clinicalJson({ ok: false, code: "unavailable" }, 503); }
}
