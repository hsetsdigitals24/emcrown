// Server startup: validate configured authentication before serving protected routes.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs" && process.env.DATABASE_URL) {
    const { authEnv } = await import("@/lib/auth-env");
    authEnv();
    if (process.env.CLINICAL_ENCRYPTION_KEYS || process.env.CLINICAL_ACTIVE_KEY || process.env.CLINICAL_TOKEN_KEY) {
      const { clinicalKeys, privateHash } = await import("@/features/clinical/encryption");
      clinicalKeys(); privateHash("startup-check");
    }
    if (process.env.CLINICAL_BOOKING_ENABLED === "true") {
      const { liveBookingEnv } = await import("@/features/clinical/env");
      liveBookingEnv();
      const { assertClinicalRuntime } = await import("@/features/clinical/runtime");
      await assertClinicalRuntime();
    }
    if (process.env.SUPABASE_URL || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_STORAGE_BUCKET) {
      const { storageEnv } = await import("@/lib/storage");
      storageEnv();
    }
  }
}
