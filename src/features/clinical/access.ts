// Server-only clinical boundary: current MFA/tenant checks and PHI-free access audit.
import "server-only";
import { cmsActor } from "@/features/cms/access";
import { appointmentEvents } from "@/lib/db/clinical";
import type { AuthTransaction } from "@/lib/db";
import type { Permission } from "@/types/auth";
export async function clinicalActor(tx: AuthTransaction, permission: Permission) { return cmsActor(tx, permission); }
export async function clinicalEvent(tx: AuthTransaction, organisationId: string, action: string, actorId?: string, appointmentId?: string) {
  await tx.insert(appointmentEvents).values({ organisationId, actorId, action, appointmentId });
}
