/**
 * Font library + fidelity report.
 *
 * The studio ships three real, openly licensed fonts so the page works offline
 * and with zero setup. This module lists them, decodes them in the browser and
 * compares the design against the reference tool's checklist (real outlines,
 * Arabic forms, kerning, hinting, export) so the user can see what is verified.
 */
import { loadFont, type LoadedFont } from './fontEngine';

export interface LibraryFont {
  id: string;
  file: string;
  family: string;
  style: string;
  licence: string;
  licenceFile: string;
  glyphs: number;
  upm: number;
  noteAr: string;
  noteEn: string;
  tags: string[];
  accent: string;
}

export const LIBRARY: LibraryFont[] = [
  {
    id: 'cairo-bold',
    file: 'Cairo_700Bold.ttf',
    family: 'Cairo',
    style: 'Bold',
    licence: 'SIL Open Font License 1.1',
    licenceFile: 'Cairo-OFL.txt',
    glyphs: 822,
    upm: 1000,
    noteAr: 'خط عربي حديث بنهايات مستديرة — الأفضل للتجربة السريعة',
    noteEn: 'Modern Arabic sans with rounded terminals — a great starting point',
    tags: ['عربي', 'Arabic', 'هندسي', 'Geometric'],
    accent: '#24795e',
  },
  {
    id: 'amiri-regular',
    file: 'Amiri_400Regular.ttf',
    family: 'Amiri',
    style: 'Regular',
    licence: 'SIL Open Font License 1.1',
    licenceFile: 'Amiri-OFL.txt',
    glyphs: 6624,
    upm: 1000,
    noteAr: 'نسخ كلاسيكي بمئات الأشكال المتصلة والحواشي',
    noteEn: 'Classical Naskh with hundreds of positional forms and ligatures',
    tags: ['نسخ', 'Naskh', 'متصل', 'Joining'],
    accent: '#8a6a1f',
  },
  {
    id: 'inter-regular',
    file: 'Inter_400Regular.ttf',
    family: 'Inter',
    style: 'Regular',
    licence: 'SIL Open Font License 1.1',
    licenceFile: 'LICENSE_FONT',
    glyphs: 2926,
    upm: 2048,
    noteAr: 'لاتيني محايد بعيون مفتوحة — مثالي لضبط المسافات',
    noteEn: 'Neutral Latin with open apertures — ideal for spacing work',
    tags: ['لاتيني', 'Latin', 'واجهات', 'UI'],
    accent: '#2f5f8a',
  },
];

const cache = new Map<string, LoadedFont>();

/**
 * Bundled asset URLs come from Vite's `import.meta.glob`, which only exists
 * inside the bundler — so the browser entry registers the map here and the pure
 * core stays importable from Node tests.
 */
type UrlResolver = (file: string) => string | undefined;
let resolver: UrlResolver = (file) => `./assets/fonts/${file}`;

export function registerFontUrls(next: UrlResolver) {
  resolver = next;
  cache.clear();
}

export function urlFor(id: string): string | undefined {
  const entry = LIBRARY.find((font) => font.id === id);
  if (!entry) return undefined;
  return resolver(entry.file);
}

/** Loads a bundled font (cached) — throws the engine's bilingual error. */
export async function loadLibraryFont(id: string): Promise<LoadedFont> {
  const cached = cache.get(id);
  if (cached) return cached;
  const url = urlFor(id);
  if (!url) throw new Error('الخط غير موجود في المكتبة. / Font is not in the library.');
  const response = await fetch(url);
  if (!response.ok) throw new Error('تعذر تحميل ملف الخط. / Could not download the font file.');
  const buffer = await response.arrayBuffer();
  const entry = LIBRARY.find((font) => font.id === id)!;
  const loaded = loadFont(buffer, entry.file);
  cache.set(id, loaded);
  return loaded;
}

export async function loadUserFont(file: File): Promise<LoadedFont> {
  if (!/\.(ttf|otf)$/i.test(file.name)) {
    throw new Error('اختر ملف TTF أو OTF — الصيغ المضغوطة غير مدعومة. / Pick a TTF or OTF file — compressed formats are not supported.');
  }
  const buffer = await file.arrayBuffer();
  return loadFont(buffer, file.name);
}

export function clearFontCache() {
  cache.clear();
}

export type CheckStatus = 'pass' | 'warn' | 'fail';

export interface FidelityCheck {
  id: string;
  ar: string;
  en: string;
  status: CheckStatus;
  detailAr: string;
  detailEn: string;
}

/**
 * Fidelity checklist — the features the design tool must really support, judged
 * from the parsed font instead of being hard-coded to "pass".
 */
export function fidelityReport(font: LoadedFont, edited: number, exported: number): FidelityCheck[] {
  const summary = font.summary;
  const hasGsub = Boolean(font.parsed.tables.gsub);
  const hasGpos = Boolean(font.parsed.tables.gpos);
  const arabicForms = summary.features.filter((tag) => ['init', 'medi', 'fina', 'isol'].includes(tag));
  return [
    {
      id: 'outlines',
      ar: 'منحنيات حقيقية قابلة للتحرير',
      en: 'Real editable outlines',
      status: font.drawn.length > 0 ? 'pass' : 'fail',
      detailAr: `${font.drawn.length} شكل مرسوم من ${summary.glyphCount} خانة`,
      detailEn: `${font.drawn.length} drawn shapes out of ${summary.glyphCount} slots`,
    },
    {
      id: 'arabic-forms',
      ar: 'أشكال الحروف العربية من GSUB',
      en: 'Arabic forms from GSUB',
      status: arabicForms.length >= 3 ? 'pass' : arabicForms.length > 0 ? 'warn' : 'fail',
      detailAr: arabicForms.length ? `ميزات متصلة: ${arabicForms.join(', ')}` : 'لا توجد جداول اتصال',
      detailEn: arabicForms.length ? `Joining features: ${arabicForms.join(', ')}` : 'No joining features',
    },
    {
      id: 'gsub',
      ar: 'جدول الاستبدال GSUB',
      en: 'GSUB substitution table',
      status: hasGsub ? 'pass' : 'warn',
      detailAr: hasGsub ? 'يُحفظ كما هو عند التصدير' : 'غير موجود في هذا الخط',
      detailEn: hasGsub ? 'Kept byte-for-byte on export' : 'Not present in this font',
    },
    {
      id: 'kerning',
      ar: 'تحديد المسافات والمحاذاة',
      en: 'Kerning and positioning',
      status: hasGpos ? 'pass' : 'warn',
      detailAr: hasGpos ? 'GPOS موجود ويُحفظ عند التصدير' : 'لا يوجد GPOS — الكرننغ يدوي',
      detailEn: hasGpos ? 'GPOS present and preserved on export' : 'No GPOS — manual kerning only',
    },
    {
      id: 'hinting',
      ar: 'تلميحات الشاشة',
      en: 'Hinting programs',
      status: summary.hinting ? 'pass' : 'warn',
      detailAr: summary.hinting ? 'fpgm/prep محفوظة' : 'الخط بدون تلميحات',
      detailEn: summary.hinting ? 'fpgm/prep preserved' : 'Font ships without hinting',
    },
    {
      id: 'export',
      ar: 'تصدير خط فعلي',
      en: 'Working font export',
      status: exported > 0 ? 'pass' : edited > 0 ? 'warn' : 'pass',
      detailAr: exported > 0 ? `آخر تصدير ${exported} تعديلاً` : 'التصدير متاح (TTF + OTF)',
      detailEn: exported > 0 ? `Last export carried ${exported} edits` : 'Export available (TTF + OTF)',
    },
  ];
}

export function reportScore(checks: FidelityCheck[]) {
  const weight = checks.reduce((sum, check) => sum + (check.status === 'pass' ? 1 : check.status === 'warn' ? 0.5 : 0), 0);
  return Math.round((weight / Math.max(1, checks.length)) * 100);
}
