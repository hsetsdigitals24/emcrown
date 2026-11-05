// Development-only migration generation; execution uses a separately privileged connection.
import { defineConfig } from "drizzle-kit";
// Canonical migration snapshots describe live; staging setup reuses reviewed SQL separately.
if (process.env.EMCROWN_DATABASE_SCOPE && process.env.EMCROWN_DATABASE_SCOPE !== "live") throw new Error("Generate canonical migrations only with live scope.");
export default defineConfig({ dialect: "postgresql", schema: ["./src/lib/db/schema.ts", "./src/lib/db/clinical.ts"], out: "./drizzle" });
