/**
 * Glyph naming / unicode helpers.
 *
 * A designer needs readable names when the font ships with `uni0628` style names:
 * we translate unicode blocks to Arabic/English labels, build new names for added
 * glyphs and drive the browser's filter chips.
 */
import type { GlyphEntry } from './glyphIndex';

export interface GlyphGroup {
  id: string;
  ar: string;
  en: string;
  match: (entry: GlyphEntry) => boolean;
}

const ARABIC_LETTER_NAMES: Record<number, string> = {
  0x0621: 'همزة',
  0x0622: 'ألف ممدودة',
  0x0623: 'ألف بهمزة',
  0x0624: 'واو بهمزة',
  0x0625: 'ألف بهمزة تحت',
  0x0626: 'ياء بهمزة',
  0x0627: 'ألف',
  0x0628: 'باء',
  0x0629: 'تاء مربوطة',
  0x062a: 'تاء',
  0x062b: 'ثاء',
  0x062c: 'جيم',
  0x062d: 'حاء',
  0x062e: 'خاء',
  0x062f: 'دال',
  0x0630: 'ذال',
  0x0631: 'راء',
  0x0632: 'زاي',
  0x0633: 'سين',
  0x0634: 'شين',
  0x0635: 'صاد',
  0x0636: 'ضاد',
  0x0637: 'طاء',
  0x0638: 'ظاء',
  0x0639: 'عين',
  0x063a: 'غين',
  0x0641: 'فاء',
  0x0642: 'قاف',
  0x0643: 'كاف',
  0x0644: 'لام',
  0x0645: 'ميم',
  0x0646: 'نون',
  0x0647: 'هاء',
  0x0648: 'واو',
  0x0649: 'ألف مقصور',
  0x064a: 'ياء',
  0x0671: 'ألف وصل',
  0x067e: 'پاء',
  0x0686: 'چه',
  0x0698: 'ژاي',
  0x06a4: 'ڤاء',
  0x06a9: 'كاف فارسية',
  0x06af: 'گاف',
  0x06cc: 'ياء فارسية',
};

const MARKS: Record<number, string> = {
  0x0640: 'تطويل',
  0x064b: 'فتحة',
  0x064c: 'ضمة',
  0x064d: 'كسرة',
  0x064e: 'فتحة',
  0x064f: 'ضمة',
  0x0650: 'كسرة',
  0x0651: 'شدة',
  0x0652: 'سكون',
  0x0653: 'مد فوق',
  0x0654: 'همزة فوق',
  0x0655: 'همزة تحت',
  0x0670: 'ألف خنجرية',
};

const LATIN_NAMES: Record<string, string> = {
  space: 'مسافة',
  period: 'نقطة',
  comma: 'فاصلة',
  hyphen: 'شرطة',
  colon: 'نقطتان',
  exclam: 'تعجب',
  question: 'سؤال',
  quotesingle: 'اقتباس',
  quotedbl: 'اقتباس مزدوج',
  zero: 'صفر',
  one: 'واحد',
  two: 'اثنان',
  three: 'ثلاثة',
  four: 'أربعة',
  five: 'خمسة',
  six: 'ستة',
  seven: 'سبعة',
  eight: 'ثمانية',
  nine: 'تسعة',
};

export function arabicNameFor(code: number | null): string {
  if (code == null) return '';
  return ARABIC_LETTER_NAMES[code] || MARKS[code] || '';
}

/** Display label: Arabic autonym for Arabic letters, the character otherwise. */
export function displayName(entry: GlyphEntry, language: 'ar' | 'en'): string {
  if (language === 'ar') {
    if (entry.script === 'arabic') {
      const name = arabicNameFor(entry.unicode);
      if (name) return name;
    }
    const latin = LATIN_NAMES[entry.name];
    if (latin) return latin;
    return entry.label;
  }
  if (entry.script === 'arabic') {
    const name = arabicNameFor(entry.unicode);
    if (name) return name;
  }
  return entry.name.replace(/^uni/, 'U+');
}

export function unicodeHex(code: number) {
  return `U+${code.toString(16).toUpperCase().padStart(4, '0')}`;
}

/** Name for a newly added glyph, following OpenType conventions. */
export function glyphNameFor(code: number, taken: Set<string>) {
  const base = `uni${code.toString(16).toUpperCase().padStart(4, '0')}`;
  if (!taken.has(base)) return base;
  let counter = 1;
  while (taken.has(`${base}.${counter}`)) counter += 1;
  return `${base}.${counter}`;
}

/** Splits a GSUB-derived name such as `uniFE91` into its base letter. */
export function baseName(name: string) {
  return name.split('.')[0];
}

export function isPresentationForm(entry: GlyphEntry) {
  return entry.unicode != null && entry.unicode >= 0xfe70 && entry.unicode <= 0xfeff;
}

export const GLYPH_GROUPS: GlyphGroup[] = [
  {
    id: 'all',
    ar: 'الكل',
    en: 'All',
    match: () => true,
  },
  {
    id: 'drawn',
    ar: 'مرسوم',
    en: 'Drawn',
    match: (entry) => entry.points > 0,
  },
  {
    id: 'empty',
    ar: 'فارغ',
    en: 'Empty',
    match: (entry) => entry.points === 0,
  },
  {
    id: 'joined',
    ar: 'متصل',
    en: 'Joining',
    match: (entry) => Object.keys(entry.forms).length > 0,
  },
  {
    id: 'marks',
    ar: 'علامات',
    en: 'Marks',
    match: (entry) => entry.category === 'mark',
  },
  {
    id: 'digits',
    ar: 'أرقام',
    en: 'Digits',
    match: (entry) => entry.unicode != null && ((entry.unicode >= 0x30 && entry.unicode <= 0x39) || (entry.unicode >= 0x660 && entry.unicode <= 0x669)),
  },
  {
    id: 'punct',
    ar: 'رموز',
    en: 'Symbols',
    match: (entry) => entry.category === 'symbol',
  },
];

/** Search by character, name, code point or hex notation. */
export function matchesQuery(entry: GlyphEntry, query: string): boolean {
  const term = query.trim().toLowerCase();
  if (!term) return true;
  if (entry.label.toLowerCase().includes(term)) return true;
  if (entry.name.toLowerCase().includes(term)) return true;
  if (entry.unicodeHex.toLowerCase().includes(term)) return true;
  if (entry.unicode != null && String(entry.unicode).includes(term)) return true;
  const arabic = arabicNameFor(entry.unicode).toLowerCase();
  if (arabic && arabic.includes(term)) return true;
  const latin = (LATIN_NAMES[entry.name] || '').toLowerCase();
  return Boolean(latin && latin.includes(term));
}

export type ScriptTab = 'arabic' | 'latin' | 'other';

export function tabFor(entry: GlyphEntry): ScriptTab {
  if (entry.script === 'arabic') return 'arabic';
  if (entry.script === 'latin') return 'latin';
  return 'other';
}

export function filterGlyphs(entries: GlyphEntry[], tab: ScriptTab, groupId: string, query: string, edited: Set<string>) {
  const group = GLYPH_GROUPS.find((candidate) => candidate.id === groupId) || GLYPH_GROUPS[0];
  return entries.filter((entry) => {
    if (tabFor(entry) !== tab) return false;
    if (groupId === 'drawn' && !edited.has(entry.name)) return false;
    if (groupId !== 'drawn' && !group.match(entry)) return false;
    return matchesQuery(entry, query);
  });
}

export const FORM_LABELS: Record<'isolated' | 'initial' | 'medial' | 'final', { ar: string; en: string }> = {
  isolated: { ar: 'منفصل', en: 'Isolated' },
  initial: { ar: 'ابتدائي', en: 'Initial' },
  medial: { ar: 'وسطي', en: 'Medial' },
  final: { ar: 'نهائي', en: 'Final' },
};
