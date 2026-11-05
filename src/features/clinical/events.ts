// Server-only clinical audit writes, independent of browser sessions for scheduled workers.
import "server-only";
import { appointmentEvents } from "@/lib/db/clinical";
import type { AuthTransaction } from "@/lib/db";
export async function clinicalEvent(tx: AuthTransaction, organisationId: string, action: string, actorId?: string, appointmentId?: string) {
  await tx.insert(appointmentEvents).values({ organisationId, actorId, action, appointmentId });
}
