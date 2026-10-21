// Shared conservative suggestions: copy exact source text; missing values stay blank for staff review.
function section(lines: string[], heading: RegExp) {
  const start = lines.findIndex(line => heading.test(line));
  if (start < 0) return "";
  const next = lines.slice(start + 1).findIndex(line => /^(education|experience|employment|qualifications|credentials|certifications|skills|languages|specialties|publications|references|professional summary|personal statement|profile|summary|contact)[:\s]*$/i.test(line));
  return lines.slice(start + 1, next < 0 ? undefined : start + 1 + next).join("\n");
}
export function cvSuggestions(text: string) {
  const lines = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  const email = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] ?? "";
  const phone = text.match(/(?:\+\d{1,3}[ .-]?)?(?:\(\d{3}\)|\d{3})[ .-]\d{3}[ .-]\d{4}/)?.[0] ?? "";
  const name = lines.find(line => line.length >= 3 && line.length <= 100 && !/curriculum|resume|résumé|@|https?:|\d/i.test(line));
  return { fullName: name ?? "", email, phone,
    title: lines.find(line => /^title\s*:/i.test(line))?.replace(/^title\s*:\s*/i, "") ?? "",
    bio: section(lines, /^(professional summary|personal statement|profile|summary)[:\s]*$/i).slice(0, 12000),
    credentials: section(lines, /^(qualifications|credentials|certifications)[:\s]*$/i).slice(0, 2000),
    specialties: section(lines, /^(specialties)[:\s]*$/i).slice(0, 2000),
    languages: section(lines, /^(languages)[:\s]*$/i).slice(0, 1000),
  };
}
