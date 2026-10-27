// Server-only optional previews: unavailable is distinct from an empty published directory.
import "server-only";
import { cache } from "react";
import { publicPhysicians } from "@/features/physicians/repository";
import { isTransientDatabaseError } from "@/lib/db/public-read";
import type { PublicPhysician } from "@/types/clinical";
export const publicPhysicianPreview = cache(async (): Promise<PublicPhysician[] | null> => {
  try { return await publicPhysicians(); }
  catch (error) {
    if (!isTransientDatabaseError(error)) throw error;
    return null;
  }
});
