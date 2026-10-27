// Server-only resilience for idempotent public reads; never use this wrapper for writes.
import "server-only";
const TRANSIENT_CODES = new Set(["CONNECT_TIMEOUT", "ECONNRESET", "ETIMEDOUT", "EAI_AGAIN", "CONNECTION_CLOSED"]);
export function isTransientDatabaseError(error: unknown): boolean {
  let current = error;
  // Drizzle wraps driver failures in a cause; never inspect or log query text/parameters.
  for (let depth = 0; depth < 5; depth += 1) {
    if (!current || typeof current !== "object") return false;
    if ("code" in current && typeof current.code === "string" && TRANSIENT_CODES.has(current.code)) return true;
    current = "cause" in current ? current.cause : undefined;
  }
  return false;
}
export async function retryPublicRead<T>(read: () => Promise<T>): Promise<T> {
  try { return await read(); }
  catch (error) {
    if (!isTransientDatabaseError(error)) throw error;
    await new Promise(resolve => setTimeout(resolve, 150));
    return read();
  }
}
