// Pure month helpers: date-only arithmetic stays in UTC to avoid visitor-zone shifts.
export function calendarCells(month: string) {
  const first = new Date(`${month}-01T12:00:00Z`);
  const start = new Date(first); start.setUTCDate(1 - first.getUTCDay());
  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(start); day.setUTCDate(start.getUTCDate() + index);
    return { id: day.toISOString().slice(0, 10), number: day.getUTCDate(), current: day.getUTCMonth() === first.getUTCMonth() };
  });
}
export function shiftMonth(month: string, offset: number) {
  const date = new Date(`${month}-01T12:00:00Z`); date.setUTCMonth(date.getUTCMonth() + offset);
  return date.toISOString().slice(0, 7);
}
