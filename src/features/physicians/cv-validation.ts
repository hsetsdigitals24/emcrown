// Shared CV byte checks bound ZIP metadata before a DOCX parser allocates decompression buffers.
import { CLINICAL_POLICY } from "@/config/clinical";
export function cvType(bytes: Uint8Array): string | null {
  if (!bytes.length || bytes.length > CLINICAL_POLICY.cvBytes) return null;
  const prefix = new TextDecoder("ascii").decode(bytes.subarray(0, 8));
  if (prefix.startsWith("%PDF-")) return "application/pdf";
  if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return "image/jpeg";
  if ([137, 80, 78, 71, 13, 10, 26, 10].every((value, index) => bytes[index] === value)) return "image/png";
  if (bytes[0] === 80 && bytes[1] === 75 && safeDocx(bytes)) return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  return null;
}
function safeDocx(bytes: Uint8Array): boolean {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  for (let offset = bytes.length - 22; offset >= Math.max(0, bytes.length - 65557); offset--) {
    if (view.getUint32(offset, true) !== 0x06054b50) continue;
    const count = view.getUint16(offset + 10, true); let cursor = view.getUint32(offset + 16, true);
    if (count > 1000 || view.getUint16(offset + 4, true) || view.getUint16(offset + 6, true)) return false;
    let total = 0; let document = false;
    for (let item = 0; item < count; item++) {
      if (cursor + 46 > bytes.length || view.getUint32(cursor, true) !== 0x02014b50 || (view.getUint16(cursor + 8, true) & 1)) return false;
      total += view.getUint32(cursor + 24, true); if (total > 20 * 1024 * 1024) return false;
      const size = view.getUint16(cursor + 28, true);
      const name = new TextDecoder().decode(bytes.subarray(cursor + 46, cursor + 46 + size));
      if (name.includes("..") || name.startsWith("/") || /vbaProject|\.docm$/i.test(name)) return false;
      if (name === "word/document.xml") document = true;
      cursor += 46 + size + view.getUint16(cursor + 30, true) + view.getUint16(cursor + 32, true);
    }
    return document;
  }
  return false;
}
