import { readableText, encodingIssues } from "./textEncoding";
import type { PageText, TextRun } from "./types";
export function normalizeSearch(s: string) {
  return s
    .normalize("NFKC")
    .replace(/[\u200B-\u200F\u202A-\u202E\u2066-\u2069]/g, "")
    .replace(/[٠-٩]/g, (c) => String(c.charCodeAt(0) - 0x660))
    .replace(/[۰-۹]/g, (c) => String(c.charCodeAt(0) - 0x6f0))
    .replace(/\s+/g, " ")
    .replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .toLocaleLowerCase();
}
const pos = (r: TextRun) => r.read || r;
/** Reorder positioned runs, not characters. Close fragments are joined; actual gaps delimit words. */
function geometricLines(runs: TextRun[]) {
  const groups: { y: number; items: TextRun[] }[] = [];
  for (const r of runs) {
    if (!r.str.trim()) continue;
    const baseline = pos(r).y + pos(r).h;
    let line = groups.find(
      (l) => Math.abs(l.y - baseline) < Math.max(2, pos(r).h * 0.3),
    );
    if (!line) {
      line = { y: baseline, items: [] };
      groups.push(line);
    }
    line.items.push(r);
  }
  return groups
    .sort((a, b) => a.y - b.y)
    .map((l) => {
      const rtl =
          l.items.filter((i) => i.dir === "rtl").length > l.items.length / 2,
        items = [...l.items].sort((a, b) =>
          rtl ? pos(b).x - pos(a).x : pos(a).x - pos(b).x,
        );
      let previous: TextRun | undefined;
      const segments: { text: string; run: TextRun | null }[] = [];
      for (const r of items) {
        const mark = /^[\u0610-\u061A\u064B-\u065F\u0670]+$/.test(r.str),
          gap = previous
            ? rtl
              ? pos(previous).x - (pos(r).x + pos(r).w)
              : pos(r).x - (pos(previous).x + pos(previous).w)
            : 0;
        if (
          previous &&
          !mark &&
          gap > Math.max(1, Math.min(pos(previous).h, pos(r).h) * 0.16)
        )
          segments.push({ text: " ", run: null });
        segments.push({ text: r.str, run: r });
        if (!mark) previous = r;
      }
      return { items, segments, text: segments.map((s) => s.text).join("") };
    });
}
export function buildText(runs: TextRun[]): PageText {
  let source = "";
  for (const r of runs) source += r.str + (r.end ? "\n" : " ");
  const groups = geometricLines(runs),
    lines = readableText(groups.map((g) => g.text).join("\n"));
  const issues = encodingIssues(source);
  const warnings: string[] = [];
  if (!source.trim()) warnings.push("no-text");
  if (issues.length) warnings.push("encoding");
  if (
    groups.some(
      (g) =>
        g.items.length > 2 &&
        Math.max(...g.items.map((r) => r.x)) -
          Math.min(...g.items.map((r) => r.x)) >
          250,
    )
  )
    warnings.push("layout");
  return {
    runs,
    rawSource: source.trim(),
    encodingIssues: issues,
    source: readableText(source.trim()),
    lines,
    warnings,
    characters: [...lines.trim()].length,
  };
}
/** Highlight all contributing runs, including Arabic words split into multiple font/glyph fragments. */
export function hits(text: PageText, query: string) {
  const q = normalizeSearch(query.trim());
  if (!q) return [];
  const found = new Set<TextRun>();
  for (const line of geometricLines(text.runs)) {
    let normalized = "";
    const owners: (TextRun | null)[] = [];
    for (const s of line.segments) {
      const chunk = normalizeSearch(s.text);
      normalized += chunk;
      for (let i = 0; i < chunk.length; i++) owners.push(s.run);
    }
    let start = normalized.indexOf(q);
    while (start !== -1) {
      owners.slice(start, start + q.length).forEach((r) => {
        if (r) found.add(r);
      });
      start = normalized.indexOf(q, start + Math.max(1, q.length));
    }
  }
  return [...found];
}
export function fullTextMatch(text: string, query: string) {
  return (
    !!query.trim() &&
    normalizeSearch(text).includes(normalizeSearch(query.trim()))
  );
}
