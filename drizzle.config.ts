// Development-only migration generation; execution uses a separately privileged connection.
import { defineConfig } from "drizzle-kit";
export default defineConfig({ dialect: "postgresql", schema: ["./src/lib/db/schema.ts", "./src/lib/db/clinical.ts"], out: "./drizzle" });
