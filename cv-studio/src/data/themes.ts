import type { PaperLang } from '../core/types';

export interface CvFontOption {
  id: string;
  cssFamily: string;
  labelAr: string;
  labelEn: string;
  script: 'ar' | 'en' | 'both';
}

export const CV_FONTS: CvFontOption[] = [
  {
    id: 'cairo',
    cssFamily: "'CvCairo', 'CvInter', system-ui, sans-serif",
    labelAr: 'القاهرة (Cairo) — عصري وواضح',
    labelEn: 'Cairo — Crisp Arabic & Latin',
    script: 'both',
  },
  {
    id: 'tajawal',
    cssFamily: "'CvTajawal', 'CvInter', system-ui, sans-serif",
    labelAr: 'تجوال (Tajawal) — انسيابي أنيق',
    labelEn: 'Tajawal — Clean Modern Sans',
    script: 'both',
  },
  {
    id: 'noto-naskh',
    cssFamily: "'CvNotoNaskh', Georgia, serif",
    labelAr: 'نوتو نسخ (Noto Naskh) — رسمي للطباعة',
    labelEn: 'Noto Naskh — Formal Print',
    script: 'ar',
  },
  {
    id: 'noto-kufi',
    cssFamily: "'CvNotoKufi', 'CvInter', sans-serif",
    labelAr: 'نوتو كوفي (Noto Kufi) — هندسي متزن',
    labelEn: 'Noto Kufi — Structured Geometric',
    script: 'ar',
  },
  {
    id: 'amiri',
    cssFamily: "'CvAmiri', Georgia, serif",
    labelAr: 'أميري (Amiri) — أكاديمي كلاسيكي',
    labelEn: 'Amiri — Academic Serif',
    script: 'ar',
  },
  {
    id: 'inter',
    cssFamily: "'CvInter', 'CvCairo', system-ui, sans-serif",
    labelAr: 'Inter — قياسي عالمي للـ ATS',
    labelEn: 'Inter — Global ATS Standard',
    script: 'en',
  },
  {
    id: 'poppins',
    cssFamily: "'CvPoppins', 'CvTajawal', sans-serif",
    labelAr: 'Poppins — عصري للتقنية والتصميم',
    labelEn: 'Poppins — Modern Tech & Product',
    script: 'en',
  },
  {
    id: 'montserrat',
    cssFamily: "'CvMontserrat', 'CvCairo', sans-serif",
    labelAr: 'Montserrat — تنفيذي وإداري',
    labelEn: 'Montserrat — Executive Sans',
    script: 'en',
  },
  {
    id: 'playfair',
    cssFamily: "'CvPlayfair', 'CvAmiri', Georgia, serif",
    labelAr: 'Playfair — كلاسيكي رفيع',
    labelEn: 'Playfair Display — Editorial Serif',
    script: 'en',
  },
];

export function resolveFontFamily(fontId: string): string {
  return CV_FONTS.find((f) => f.id === fontId)?.cssFamily || CV_FONTS[0].cssFamily;
}

export function defaultFontForPaperLang(paperLang: PaperLang, currentFontId?: string): string {
  if (currentFontId) {
    const found = CV_FONTS.find((f) => f.id === currentFontId);
    if (found && (found.script === 'both' || found.script === paperLang)) {
      return found.id;
    }
  }
  return paperLang === 'ar' ? 'cairo' : 'inter';
}

export interface ColorSwatchOption {
  hex: string;
  labelAr: string;
  labelEn: string;
}

export const CV_COLOR_SWATCHES: ColorSwatchOption[] = [
  { hex: '#24795e', labelAr: 'أخضر UniTool الاحترافي', labelEn: 'UniTool Emerald' },
  { hex: '#111827', labelAr: 'أسود كلاسيكي للـ ATS', labelEn: 'Classic ATS Ink' },
  { hex: '#1f4e5f', labelAr: 'بترولي تنفيذي هادئ', labelEn: 'Executive Petrol' },
  { hex: '#1b4332', labelAr: 'أخضر غابي رصين', labelEn: 'Deep Forest' },
  { hex: '#374151', labelAr: 'رمادي مؤسسي محايد', labelEn: 'Corporate Slate' },
  { hex: '#6b2737', labelAr: 'عنّابي أكاديمي', labelEn: 'Academic Burgundy' },
  { hex: '#7c4a2d', labelAr: 'برونزي دافئ', labelEn: 'Warm Bronze' },
  { hex: '#115e59', labelAr: 'تيل رسمي داكن', labelEn: 'Deep Teal' },
];
