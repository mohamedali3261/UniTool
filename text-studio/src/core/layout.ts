import { type Design, textDirection } from "./model";
export type Measure = (text: string, size: number) => number;
const graphemes = (s: string) =>
  Array.from(
    new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(s),
    (x) => x.segment,
  );
export function wrapText(
  text: string,
  width: number,
  size: number,
  measure: Measure,
) {
  const lines: string[] = [];
  for (const paragraph of text.split("\n")) {
    if (!paragraph) {
      lines.push("");
      continue;
    }
    let line = "";
    for (const word of paragraph.split(/(\s+)/)) {
      const next = line + word;
      if (measure(next, size) <= width) {
        line = next;
        continue;
      }
      if (line.trim()) {
        lines.push(line.trimEnd());
        line = "";
      }
      const token = word.trimStart();
      if (measure(token, size) <= width) {
        line = token;
        continue;
      }
      for (const char of graphemes(token)) {
        if (line && measure(line + char, size) > width) {
          lines.push(line);
          line = "";
        }
        line += char;
      }
    }
    lines.push(line.trimEnd());
  }
  return lines;
}
export function layoutText(d: Design, measure: Measure) {
  const available = Math.max(1, d.width - 2 * d.padding),
    caption = d.signature ? 58 : 0,
    height = d.height - 2 * d.padding - caption;
  let size = d.size,
    lines = wrapText(d.text, available, size, measure);
  const fits = (ls: string[], sz: number) =>
    ls.length * sz * d.lineHeight <= height &&
    ls.every((s) => measure(s, sz) <= available);
  if (d.autoFit && !fits(lines, size)) {
    let low = 16,
      high = d.size,
      best = 16;
    while (low <= high) {
      const mid = Math.floor((low + high) / 2),
        ls = wrapText(d.text, available, mid, measure);
      if (fits(ls, mid)) {
        best = mid;
        low = mid + 1;
      } else high = mid - 1;
    }
    size = best;
    lines = wrapText(d.text, available, size, measure);
  }
  let signatureSize = Math.max(12, Math.min(26, size * 0.4));
  while (signatureSize > 8 && measure(d.signature, signatureSize) > available)
    signatureSize--;
  const lineStep = size * d.lineHeight,
    blockHeight = lines.length * lineStep;
  const x =
    d.align === "left"
      ? d.padding
      : d.align === "right"
        ? d.width - d.padding
        : d.width / 2;
  return {
    lines,
    size,
    lineStep,
    x,
    firstY:
      (d.height - caption - blockHeight) / 2 + lineStep * 0.5 + size * 0.32,
    overflow:
      !fits(lines, size) || measure(d.signature, signatureSize) > available,
    signatureSize,
    direction: textDirection(d.text, d.direction),
  };
}
