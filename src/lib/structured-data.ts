// Shared JSON serializer: escape HTML delimiters so data cannot end its script element.
export function serializeStructuredData(data: Record<string, unknown>): string {
  const escapes: Record<string, string> = { "<": "\\u003c", ">": "\\u003e", "&": "\\u0026", "\u2028": "\\u2028", "\u2029": "\\u2029" };
  return JSON.stringify(data).replace(/[<>&\u2028\u2029]/g, (character) => escapes[character]);
}
