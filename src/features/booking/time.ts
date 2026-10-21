// Shared pure formatting: slots stay in UTC; display uses the configured practice zone.
export function practiceDate(utc: string, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date(utc));
  const value = (type: string) => parts.find((part) => part.type === type)?.value;
  return `${value("year")}-${value("month")}-${value("day")}`;
}
export function formatDay(dateId: string, timeZone: string, locale: string): string {
  // Noon-ish UTC avoids the previous-day display caused by parsing midnight UTC in Eastern.
  return new Intl.DateTimeFormat(locale, { timeZone, weekday: "short", month: "short", day: "numeric", year: "numeric" }).format(new Date(`${dateId}T14:00:00Z`));
}
export function formatTime(utc: string, timeZone: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, { timeZone, hour: "numeric", minute: "2-digit", timeZoneName: "short" }).format(new Date(utc));
}
