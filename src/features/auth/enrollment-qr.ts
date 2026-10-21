// Server-only QR generation: keep enrollment secrets out of external URLs and image caches.
import "server-only";
import QRCode from "qrcode";
import { enrollmentUri } from "@/features/auth/enrollment-uri";
export async function enrollmentQr(setupKey: string, email: string) {
  try {
    return await QRCode.toDataURL(enrollmentUri(setupKey, email), {
      type: "image/png", errorCorrectionLevel: "M", margin: 4, width: 320,
    });
  } catch {
    // Manual enrollment stays usable; never log a library error containing its input.
    console.error("MFA setup QR could not be generated.");
    return undefined;
  }
}
