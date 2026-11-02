/** A font-private code has no portable meaning. Never infer a letter from its number. */
export const unknownGlyphPattern =
  /[\p{Co}\uFFFD\u0000-\u0008\u000B-\u000C\u000E-\u001F\u007F-\u009F]/gu;
export interface EncodingIssue {
  code: string;
  count: number;
}
export function encodingIssues(text: string): EncodingIssue[] {
  const counts = new Map<string, number>();
  for (const match of text.matchAll(unknownGlyphPattern)) {
    const code =
      "U+" +
      match[0].codePointAt(0)!.toString(16).toUpperCase().padStart(4, "0");
    counts.set(code, (counts.get(code) || 0) + 1);
  }
  return [...counts].map(([code, count]) => ({ code, count }));
}
/** Expand Arabic presentation forms only, preserving dates, identifiers, digits and diacritics.
 * Unknown glyphs remain explicit replacement markers, not guessed words or silent deletions.
 * Apply after geometry joins fragments so ligatures cannot change their measured positions.
 */
export function readableText(text: string): string {
  return text
    .replace(/[\uFB50-\uFDFF\uFE70-\uFEFC]+/gu, (part) =>
      [...part]
        .map((char) => {
          const normalized = char.normalize("NFKC");
          return /[\uFE70-\uFE7F]/u.test(char)
            ? normalized.replace(/^[ \u0640]/u, "")
            : normalized;
        })
        .join(""),
    )
    .replace(unknownGlyphPattern, "\uFFFD");
}
