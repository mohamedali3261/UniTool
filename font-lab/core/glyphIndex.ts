/**
 * Glyph indexing + Arabic positional analysis.
 *
 * The editor shows one letter at a time (like the reference tool), but Arabic
 * letters change shape by position. We read the real GSUB substitution table so
 * isolated / initial / medial / final glyphs come from the font itself instead
 * of being guessed from names.
 */
import type { LoadedFont } from './fontEngine';

export type ArabicPosition = 'isolated' | 'initial' | 'medial' | 'final';

export interface GlyphEntry {
  name: string;
  unicode: number | null;
  label: string;
  unicodeHex: string;
  script: 'arabic' | 'latin' | 'other';
  category: 'letter' | 'mark' | 'symbol' | 'ligature';
  points: number;
  commandCount: number;
  advance: number;
  /** forms resolved from the font's GSUB table */
  forms: Partial<Record<ArabicPosition, string>>;
}

const ARABIC: Array<[number, number]> = [
  [0x0600, 0x06ff],
  [0x0750, 0x077f],
  [0x08a0, 0x08ff],
  [0xfb50, 0xfdff],
  [0xfe70, 0xfeff],
];
const LATIN: Array<[number, number]> = [
  [0x0020, 0x024f],
  [0x1e00, 0x1eff],
];

function inRanges(code: number, ranges: Array<[number, number]>) {
  return ranges.some(([a, b]) => code >= a && code <= b);
}

/** Arabic letters that never join the following letter (right-joining only). */
const NON_JOINING_NEXT = new Set([
  0x0621, // hamza
  0x0622, 0x0623, 0x0624, 0x0625, 0x0627, 0x0629, 0x062f, 0x0630, 0x0631,
  0x0632, 0x0648, 0x0625, 0x0649, 0x064a, 0x0671, 0x0672, 0x0673, 0x0675,
  0x0676, 0x0677, 0x0688, 0x0689, 0x068a, 0x068b, 0x068c, 0x068d, 0x068e,
  0x068f, 0x0690, 0x0691, 0x0692, 0x0693, 0x0694, 0x0695, 0x0696, 0x0697,
  0x0698, 0x0699, 0x06c0, 0x06c3, 0x06c4, 0x06c5, 0x06c6, 0x06c7, 0x06c8,
  0x06c9, 0x06ca, 0x06cb, 0x06cd, 0x06cf, 0x06d2, 0x06d3,
]);

/** Marks/diacritics attach to the previous letter and do not join forward. */
const MARK_RANGES: Array<[number, number]> = [
  [0x064b, 0x065f],
  [0x0610, 0x061a],
  [0x06d6, 0x06dc],
  [0x06df, 0x06e8],
  [0x06ea, 0x06ed],
  [0x0300, 0x036f],
];

export function isCombiningMark(code: number) {
  return inRanges(code, MARK_RANGES);
}

/** Which positional form a letter takes, based on its neighbours. */
export function arabicFormFor(prev: number | null, next: number | null): ArabicPosition {
  const joinsPrev = prev != null && !NON_JOINING_NEXT.has(prev) && !isCombiningMark(prev);
  const joinsNext = next != null && !NON_JOINING_NEXT.has(next) && !isCombiningMark(next);
  if (joinsPrev && joinsNext) return 'medial';
  if (joinsPrev) return 'final';
  if (joinsNext) return 'initial';
  return 'isolated';
}

interface Substitution {
  to: string;
  feature: string;
}

/**
 * Extracts contextual substitution rules from GSUB.
 * opentype.js exposes coverage/substitute as glyph *indices*, and features list
 * the lookups they own, so we resolve both through the glyph table.
 */
export function readSubstitutions(font: LoadedFont): Map<string, Substitution[]> {
  const result = new Map<string, Substitution[]>();
  const gsub = font.parsed.tables.gsub as any;
  if (!gsub) return result;

  const nameAt = (index: number): string | null => {
    const glyph = font.parsed.glyphs.get(index);
    if (!glyph) return null;
    return glyph.name || null;
  };

  const lookups: any[] = gsub.lookups || [];
  const loopkupFeature = new Map<number, string>();
  (gsub.features || []).forEach((entry: any) => {
    const tag = String(entry?.tag || '');
    for (const lookupIndex of entry?.feature?.lookupListIndexes || []) {
      if (!loopkupFeature.has(lookupIndex)) loopkupFeature.set(lookupIndex, tag);
    }
  });

  lookups.forEach((lookup, lookupIndex) => {
    const feature = loopkupFeature.get(lookupIndex) || '';
    if (lookup?.lookupType !== 1) return;
    for (const table of lookup.subtables || []) {
      const coverage = table?.coverage?.glyphs;
      const substitutes = table?.substitute;
      if (!Array.isArray(coverage) || !Array.isArray(substitutes)) continue;
      coverage.forEach((fromIndex: number, position: number) => {
        const from = nameAt(fromIndex);
        const to = nameAt(substitutes[position]);
        if (!from || !to) return;
        const list = result.get(from) || [];
        if (!list.some((entry) => entry.to === to && entry.feature === feature)) {
          list.push({ to, feature });
        }
        result.set(from, list);
      });
    }
  });
  return result;
}

const FEATURE_TO_FORM: Record<string, ArabicPosition> = {
  init: 'initial',
  medi: 'medial',
  fina: 'final',
  isol: 'isolated',
};

export function buildIndex(font: LoadedFont): GlyphEntry[] {
  const substitutions = readSubstitutions(font);
  const entries: GlyphEntry[] = [];

  for (const name of font.drawn) {
    const shape = font.glyphs.get(name);
    if (!shape) continue;
    const code = shape.unicode ?? -1;
    const script: GlyphEntry['script'] = inRanges(code, ARABIC)
      ? 'arabic'
      : inRanges(code, LATIN)
        ? 'latin'
        : 'other';
    const isMark = code >= 0 && isCombiningMark(code);
    const isLetter = script === 'arabic' || (code >= 0x41 && code <= 0x7a);

    const forms: Partial<Record<ArabicPosition, string>> = {};
    for (const sub of substitutions.get(name) || []) {
      const form = FEATURE_TO_FORM[sub.feature];
      if (form && !forms[form] && font.glyphs.has(sub.to)) forms[form] = sub.to;
    }

    let label = name;
    if (code >= 0) {
      try {
        label = String.fromCodePoint(code);
      } catch {
        label = name;
      }
    }

    entries.push({
      name,
      unicode: shape.unicode,
      label,
      unicodeHex: code >= 0 ? `U+${code.toString(16).toUpperCase().padStart(4, '0')}` : '—',
      script,
      category: isMark ? 'mark' : isLetter ? 'letter' : shape.points.length > 40 ? 'ligature' : 'symbol',
      points: shape.points.length,
      commandCount: shape.commands.split(/(?=[MLQCZ])/).filter(Boolean).length,
      advance: shape.advanceWidth,
      forms,
    });
  }
  return entries;
}

export function formGlyphName(entry: GlyphEntry, form: ArabicPosition): string {
  return entry.forms[form] || entry.name;
}

/** Coverage of the three scripts, used by the font report. */
export function scriptCoverage(entries: GlyphEntry[]) {
  const total = Math.max(1, entries.length);
  const arabic = entries.filter((entry) => entry.script === 'arabic').length;
  const latin = entries.filter((entry) => entry.script === 'latin').length;
  const other = entries.length - arabic - latin;
  return {
    arabic,
    latin,
    other,
    arabicPct: Math.round((arabic / total) * 100),
    latinPct: Math.round((latin / total) * 100),
    otherPct: Math.round((other / total) * 100),
  };
}
