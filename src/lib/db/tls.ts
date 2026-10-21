// Server-only database TLS policy: share verified settings between runtime and migrations.
import "server-only";
import { X509Certificate } from "node:crypto";
import type { ConnectionOptions } from "node:tls";
export function databaseTls(certificate?: string): ConnectionOptions {
  const options: ConnectionOptions = { rejectUnauthorized: true, minVersion: "TLSv1.2" };
  if (!certificate?.trim()) return options;
  const ca = certificate.replace(/\\n/g, "\n").trim();
  try {
    const parsed = new X509Certificate(ca);
    if (!parsed.ca || Date.parse(parsed.validTo) <= Date.now() || Date.parse(parsed.validFrom) > Date.now()) throw new Error();
  } catch { throw new Error("DATABASE_CA_CERT must contain a valid, current CA certificate in PEM format."); }
  return { ...options, ca };
}
