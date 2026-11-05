// Server-only clinical boundary: current MFA/tenant checks and PHI-free access audit.
import "server-only";
import { cmsActor } from "@/features/cms/access";
import type { AuthTransaction } from "@/lib/db";
import type { Permission } from "@/types/auth";
export async function clinicalActor(tx: AuthTransaction, permission: Permission) { return cmsActor(tx, permission); }
export { clinicalEvent } from "@/features/clinical/events";
