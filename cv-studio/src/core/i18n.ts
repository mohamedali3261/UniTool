import type { CoreSectionId, LanguageItem, LayoutMode, PaperLang, SkillDisplayMode, UiLang } from './types';

export function tr(lang: UiLang, ar: string, en: string): string {
  return lang === 'ar' ? ar : en;
}

export const SECTION_TITLES: Record<CoreSectionId, { ar: string; en: string }> = {
  summary: { ar: 'الملخص المهني', en: 'Professional Summary' },
  experience: { ar: 'الخبرات العملية', en: 'Work Experience' },
  education: { ar: 'التعليم والمؤهلات الأكاديمية', en: 'Education' },
  certifications: { ar: 'الشهادات المهنية والدورات', en: 'Certifications & Courses' },
  skills: { ar: 'المهارات التقنية والمهنية', en: 'Skills' },
  languages: { ar: 'اللغات', en: 'Languages' },
  projects: { ar: 'المشاريع البارزة', en: 'Key Projects' },
  custom: { ar: 'أقسام إضافية', en: 'Additional Sections' },
};

export function getPaperSectionTitle(
  id: CoreSectionId,
  paperLang: PaperLang,
  customAr?: string,
  customEn?: string,
): string {
  if (paperLang === 'ar' && customAr?.trim()) return customAr.trim();
  if (paperLang === 'en' && customEn?.trim()) return customEn.trim();
  return SECTION_TITLES[id][paperLang];
}

export const PROFICIENCY_LABELS: Record<LanguageItem['proficiency'], { ar: string; en: string }> = {
  native: { ar: 'اللغة الأم', en: 'Native' },
  fluent: { ar: 'طلاقة كاملة (C2)', en: 'Fluent (C2)' },
  advanced: { ar: 'متقدم (C1)', en: 'Advanced (C1)' },
  intermediate: { ar: 'متوسط (B2)', en: 'Intermediate (B2)' },
  basic: { ar: 'مبتدئ (A2)', en: 'Basic (A2)' },
};

export const LAYOUT_MODE_LABELS: Record<LayoutMode, { ar: string; en: string; descAr: string; descEn: string }> = {
  ats: {
    ar: 'متوافق 100% مع ATS',
    en: '100% ATS Friendly',
    descAr: 'عمود واحد قياسي واضح، بدون عناصر تشتت أنظمة الفرز الآلي.',
    descEn: 'Standard single-column hierarchy built for strict ATS parsing.',
  },
  modern: {
    ar: 'التصميم العصري والتنفيذي',
    en: 'Modern & Executive',
    descAr: 'عمودان متوازنان أو ترويسة تنفيذية أنيقة بألوان احترافية هادئة.',
    descEn: 'Balanced two-column or executive banner header with calm tones.',
  },
  'one-page': {
    ar: 'صفحة واحدة مكثفة (One-Page Fit)',
    en: 'One-Page Fit',
    descAr: 'يضبط المسافات والهوامش وحجم العناصر بذكاء لتناسب صفحة واحدة.',
    descEn: 'Smartly adjusts spacing, margins, and scale to fit a single page.',
  },
  detailed: {
    ar: 'السيرة التفصيلية متعددة الصفحات',
    en: 'Detailed Multi-Page',
    descAr: 'للأكاديميين وأصحاب الخبرة الطويلة مع تقسيم وترقيم صفحات تلقائي.',
    descEn: 'For academics & senior careers with automatic A4/Letter pagination.',
  },
};

export const SKILL_DISPLAY_LABELS: Record<SkillDisplayMode, { ar: string; en: string }> = {
  badges: { ar: 'شارات منظمة', en: 'Clean Badges' },
  bars: { ar: 'أشرطة مستوى', en: 'Level Bars' },
  dots: { ar: 'مؤشر نقطي (●●●○○)', en: 'Dot Matrix' },
  bullets: { ar: 'نقاط مختصرة', en: 'Bullet Points' },
  comma: { ar: 'نص مفصول بفواصل (ATS)', en: 'Comma-Separated (ATS)' },
};

export function formatPaperPresent(paperLang: PaperLang): string {
  return paperLang === 'ar' ? 'حتى الآن' : 'Present';
}

export function formatPageNumber(page: number, total: number, paperLang: PaperLang): string {
  return paperLang === 'ar' ? `صفحة ${page} من ${total}` : `Page ${page} of ${total}`;
}
