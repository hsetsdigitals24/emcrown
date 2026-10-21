// Shared pure conversion: reject ambiguous/nonexistent wall times across DST changes.
export function localTimeToUtc(day: string, clock: string, timeZone: string): Date | null {
  const formatter = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
  function parts(date: Date) {
    const values = formatter.formatToParts(date);
    const get = (type: string) => Number(values.find(part => part.type === type)?.value);
    return { year: get("year"), month: get("month"), day: get("day"), hour: get("hour"), minute: get("minute") };
  }
  const [year, month, date] = day.split("-").map(Number);
  const [hour, minute] = clock.split(":").map(Number);
  const target = Date.UTC(year, month - 1, date, hour, minute);
  const offsets = new Set([-86400000, 0, 86400000].map(delta => {
    const stamp = target + delta; const p = parts(new Date(stamp));
    return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute) - stamp;
  }));
  const matches = Array.from(offsets).map(offset => new Date(target - offset)).filter(value => {
    const p = parts(value); return p.year === year && p.month === month && p.day === date && p.hour === hour && p.minute === minute;
  });
  return matches.length === 1 ? matches[0] : null;
}
