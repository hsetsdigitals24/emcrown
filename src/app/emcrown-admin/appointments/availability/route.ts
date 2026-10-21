// Server staff availability: authenticated tenant scope and optional current-reservation exclusion.
import { z } from "zod";
import { db } from "@/lib/db";
import { clinicalHttp } from "@/features/clinical/http";
import { dateSchema } from "@/features/clinical/validation";
import { clinicalActor } from "@/features/clinical/access";
import { availableSlots } from "@/features/appointments/availability";
const querySchema = z.object({ from: dateSchema, exceptId: z.uuid().optional() }).strict();
export async function GET(request: Request) {
  return clinicalHttp(request, async () => {
    const query = querySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!query.success) return { ok: false, code: "invalid" };
    return db().transaction(async tx => {
      const actor = await clinicalActor(tx, "appointments:manage"); if (!actor) return { ok: false, code: "denied" };
      return { ok: true, data: await availableSlots(tx, actor.organisationId, query.data.from, undefined, query.data.exceptId) };
    });
  });
}
