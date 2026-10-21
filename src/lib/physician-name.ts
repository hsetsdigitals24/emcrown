// Shared display helper: preserve the saved professional title before the name.
export function physicianName(record: { title: string; fullName: string }) {
  return [record.title.trim(), record.fullName.trim()].filter(Boolean).join(" ");
}
