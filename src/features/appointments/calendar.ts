// Server-safe calendar generation: minimal event details and escaped text; no patient identifiers.
import { SITE_FOOTER } from "@/config/site-shell";
function escape(value: string) { return value.replace(/\\/g, "\\\\").replace(/\r?\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;"); }
function stamp(value: string) { return new Date(value).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, ""); }
export function calendarAttachment(event: { startUtc: string; endUtc: string; location: string; uid: string }) {
  return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Emcrown//Appointments//EN", "METHOD:PUBLISH", "BEGIN:VEVENT",
    `UID:${event.uid}@emcrown`, `DTSTAMP:${stamp(new Date().toISOString())}`, `DTSTART:${stamp(event.startUtc)}`, `DTEND:${stamp(event.endUtc)}`,
    `SUMMARY:${escape(SITE_FOOTER.practiceName)}`, `LOCATION:${escape(event.location)}`, "END:VEVENT", "END:VCALENDAR", ""].join("\r\n");
}
