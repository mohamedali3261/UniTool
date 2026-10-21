/**
 * Ready-made design templates.
 * Coordinates are fractions of the canvas (x/y = center anchor, origin center).
 * Sizes (size/w/h) are fractions of the template's base width so they scale
 * cleanly onto any canvas the user applies them to.
 */

export type TemplateCategory = 'promo' | 'social' | 'quote' | 'youtube' | 'event';

export interface TemplateObjectDef {
  type: 'text' | 'rect' | 'circle';
  x: number; // 0..1 fraction of canvas width (center anchor)
  y: number; // 0..1 fraction of canvas height (center anchor)
  text?: string;
  fontFamily?: string;
  fontWeight?: string | number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  size?: number; // text: fontSize as fraction of base width; circle: radius fraction
  w?: number;    // rect width fraction of canvas width
  h?: number;    // rect height fraction of canvas height
  rx?: number;   // rect corner radius fraction of canvas width
  opacity?: number;
  rotation?: number;
}

export interface DesignTemplate {
  id: string;
  cat: TemplateCategory;
  nameAr: string;
  nameEn: string;
  descAr?: string;
  descEn?: string;
  bg: string;
  bg2?: string; // optional gradient second stop (linear diagonal)
  baseW: number;
  baseH: number;
  objects: TemplateObjectDef[];
}

export const TEMPLATE_CATEGORIES: { id: 'all' | TemplateCategory; nameAr: string; nameEn: string }[] = [
  { id: 'all', nameAr: 'الكل', nameEn: 'All' },
  { id: 'promo', nameAr: 'عروض وتخفيضات', nameEn: 'Promo & Sale' },
  { id: 'social', nameAr: 'سوشيال ميديا', nameEn: 'Social' },
  { id: 'quote', nameAr: 'اقتباسات', nameEn: 'Quotes' },
  { id: 'youtube', nameAr: 'يوتيوب', nameEn: 'YouTube' },
  { id: 'event', nameAr: 'مناسبات وبنرات', nameEn: 'Events & Banners' }
];

export const TEMPLATE_CATALOG: DesignTemplate[] = [
  // ---------------- PROMO ----------------
  {
    id: 'promo-discount-50',
    cat: 'promo',
    nameAr: 'إعلان خصم 50%',
    nameEn: 'Discount 50% Banner',
    descAr: 'خصم جريء مع شريط ملاحظة وزر دعوة لإجراء',
    descEn: 'Bold sale banner with note strip & CTA button',
    bg: '#B91C1C',
    bg2: '#450A0A',
    baseW: 1080,
    baseH: 1080,
    objects: [
      { type: 'rect', x: 0.5, y: 0.16, w: 0.42, h: 0.012, fill: '#FBBF24' },
      { type: 'text', x: 0.5, y: 0.34, text: 'خصم 50%', fontFamily: 'Lalezar', size: 0.19, fill: '#FFFFFF' },
      { type: 'text', x: 0.5, y: 0.52, text: 'على جميع منتجات المتجر · لفترة محدودة', fontFamily: 'Tajawal', size: 0.05, fill: '#FDE68A' },
      { type: 'circle', x: 0.5, y: 0.68, size: 0.13, fill: '#FFFFFF' },
      { type: 'text', x: 0.5, y: 0.68, text: 'تسوق الآن', fontFamily: 'Cairo', size: 0.042, fill: '#7F1D1D', fontWeight: 800 },
      { type: 'rect', x: 0.5, y: 0.88, w: 0.42, h: 0.012, fill: 'rgba(251,191,36,0.45)' }
    ]
  },
  {
    id: 'promo-price-tag',
    cat: 'promo',
    nameAr: 'تاج سعر وخصم',
    nameEn: 'Price & Deal Card',
    descAr: 'سعر كبير مع سعر قديم مشطوب على خلفية نظيفة',
    descEn: 'Big price with struck-through old price on a clean card',
    bg: '#FFFFFF',
    baseW: 1080,
    baseH: 1080,
    objects: [
      { type: 'text', x: 0.5, y: 0.3, text: 'عرض خاص', fontFamily: 'Cairo', size: 0.05, fill: '#0284C7', fontWeight: 700 },
      { type: 'text', x: 0.5, y: 0.47, text: '99 ج.م', fontFamily: 'Lalezar', size: 0.17, fill: '#0F172A' },
      { type: 'text', x: 0.5, y: 0.66, text: 'بدلاً من 199 ج.م', fontFamily: 'Tajawal', size: 0.05, fill: '#94A3B8', fontWeight: 500 },
      { type: 'rect', x: 0.5, y: 0.66, w: 0.235, h: 0.008, fill: '#F43F5E', rotation: 0 },
      { type: 'rect', x: 0.5, y: 0.82, w: 0.5, h: 0.05, rx: 0.025, fill: '#0284C7' },
      { type: 'text', x: 0.5, y: 0.82, text: 'اطلب الآن', fontFamily: 'Cairo', size: 0.038, fill: '#FFFFFF', fontWeight: 700 }
    ]
  },

  // ---------------- SOCIAL ----------------
  {
    id: 'social-story-sale',
    cat: 'social',
    nameAr: 'ستوري عرض مغري',
    nameEn: 'Story Splash Sale',
    descAr: 'تدرج وردي-بنفسجي بعنوان منتصف ونص سفلي',
    descEn: 'Pink-to-violet gradient with centered title & caption',
    bg: '#EC4899',
    bg2: '#7C3AED',
    baseW: 1080,
    baseH: 1920,
    objects: [
      { type: 'text', x: 0.5, y: 0.3, text: 'عرض نهاية الأسبوع', fontFamily: 'Cairo', size: 0.12, fill: '#FFFFFF', fontWeight: 900 },
      { type: 'rect', x: 0.5, y: 0.38, w: 0.22, h: 0.008, fill: '#FDE047' },
      { type: 'text', x: 0.5, y: 0.47, text: 'خصم يصل إلى 60%\nعلى كل ما هو جديد', fontFamily: 'Tajawal', size: 0.07, fill: '#FBCFE8' },      { type: 'circle', x: 0.5, y: 0.63, size: 0.16, fill: '#FFFFFF' },
      { type: 'text', x: 0.5, y: 0.63, text: 'اكتشف\nالعرض', fontFamily: 'Cairo', size: 0.055, fill: '#7C3AED', fontWeight: 800 }
    ]
  },
  {
    id: 'social-post-announcement',
    cat: 'social',
    nameAr: 'منشور إعلان جديد',
    nameEn: 'New Launch Post',
    descAr: 'إعلان بسيط أنيق للإطلاقات والمستجدات',
    descEn: 'Clean launch announcement post',
    bg: '#FFFFFF',
    bg2: '#E0F2FE',
    baseW: 1080,
    baseH: 1080,
    objects: [
      { type: 'circle', x: 0.5, y: 0.26, size: 0.1, fill: '#0284C7' },
      { type: 'text', x: 0.5, y: 0.26, text: 'جديد', fontFamily: 'Cairo', size: 0.04, fill: '#FFFFFF', fontWeight: 800 },
      { type: 'text', x: 0.5, y: 0.48, text: 'أطلقنا المنتج\nاللي كنتوا طلبوه', fontFamily: 'Cairo', size: 0.085, fill: '#0F172A', fontWeight: 800 },
      { type: 'text', x: 0.5, y: 0.72, text: 'متاح الآن في كل الفروع\nوعلى الموقع الرسمي', fontFamily: 'Tajawal', size: 0.042, fill: '#475569' }
    ]
  },

  // ---------------- QUOTE ----------------
  {
    id: 'quote-night',
    cat: 'quote',
    nameAr: 'منشور اقتباس ليلي',
    nameEn: 'Midnight Quote Post',
    descAr: 'اقتباس ولمسة ذهبية مفصولة بخط رفيع',
    descEn: 'Night quote with a thin gold divider',
    bg: '#0F172A',
    bg2: '#1E1B4B',
    baseW: 1080,
    baseH: 1080,
    objects: [
      { type: 'text', x: 0.5, y: 0.18, text: 'اقتباس اليوم', fontFamily: 'Amiri', size: 0.038, fill: '#94A3B8' },
      { type: 'text', x: 0.5, y: 0.42, text: 'النجاح رحلة\nوليس وجهة', fontFamily: 'Amiri', size: 0.095, fill: '#F8FAFC' },
      { type: 'rect', x: 0.5, y: 0.62, w: 0.16, h: 0.006, fill: '#FBBF24' },
      { type: 'text', x: 0.5, y: 0.72, text: '— سعيد، رجل أعمال', fontFamily: 'Tajawal', size: 0.038, fill: '#CBD5E1' }
    ]
  },

  // ---------------- YOUTUBE ----------------
  {
    id: 'youtube-tips',
    cat: 'youtube',
    nameAr: 'ثمبنيل зубقة يوتيوب',
    nameEn: 'Bold YouTube Thumbnail',
    descAr: 'عنوان فخم مع شريط أحمر جانبي وشارة بارزة',
    descEn: 'Heavy title with side accent bar & badge',
    bg: '#09090B',
    baseW: 1920,
    baseH: 1080,
    objects: [
      { type: 'rect', x: 0.16, y: 0.5, w: 0.045, h: 0.36, fill: '#EF4444' },
      { type: 'text', x: 0.56, y: 0.4, text: 'أفضل 5 نصائح', fontFamily: 'Cairo', size: 0.086, fill: '#FFFFFF', fontWeight: 900 },
      { type: 'text', x: 0.58, y: 0.62, text: 'لنمو قناتك بسرعة', fontFamily: 'Cairo', size: 0.062, fill: '#93C5FD', fontWeight: 700 },
      { type: 'rect', x: 0.28, y: 0.82, w: 0.18, h: 0.09, rx: 0.02, fill: '#EF4444' },
      { type: 'text', x: 0.28, y: 0.82, text: 'جديد', fontFamily: 'Cairo', size: 0.05, fill: '#FFFFFF', fontWeight: 800 }
    ]
  },

  // ---------------- EVENT ----------------
  {
    id: 'event-webinar',
    cat: 'event',
    nameAr: 'إعلان ندوة مجانية',
    nameEn: 'Free Webinar Announce',
    descAr: 'إعلان مناسبة خامر مع تاريخ وزر الحجز',
    descEn: 'Emerald event announce with date & RSVP button',
    bg: '#064E3B',
    bg2: '#047857',
    baseW: 1080,
    baseH: 1080,
    objects: [
      { type: 'text', x: 0.5, y: 0.22, text: 'ندوة مجانية', fontFamily: 'Lalezar', size: 0.13, fill: '#FBBF24' },
      { type: 'text', x: 0.5, y: 0.4, text: 'أساسيات التصميم\nلأصحاب المشاريع', fontFamily: 'Cairo', size: 0.075, fill: '#FFFFFF', fontWeight: 800 },
      { type: 'rect', x: 0.5, y: 0.58, w: 0.2, h: 0.006, fill: 'rgba(251,191,36,0.6)' },
      { type: 'text', x: 0.5, y: 0.67, text: 'الأحد · 8 مساءً · أونلاين', fontFamily: 'Tajawal', size: 0.045, fill: '#D1FAE5' },
      { type: 'rect', x: 0.5, y: 0.82, w: 0.3, h: 0.07, rx: 0.035, fill: '#FBBF24' },
      { type: 'text', x: 0.5, y: 0.82, text: 'احجز مكانك', fontFamily: 'Cairo', size: 0.04, fill: '#064E3B', fontWeight: 800 }
    ]
  },
  {
    id: 'event-banner-play',
    cat: 'event',
    nameAr: 'بانر جوجل بلاي',
    nameEn: 'Google Play Banner',
    descAr: 'بنر 1024×500 مع خلفية كحلية وتعليق واضح',
    descEn: '1024×500 banner with deep blue background & centered title',
    bg: '#0B132B',
    baseW: 1024,
    baseH: 500,
    objects: [
      { type: 'rect', x: 0.5, y: 0.34, w: 0.4, h: 0.018, rx: 0.009, fill: '#3DDC84' },
      { type: 'text', x: 0.5, y: 0.55, text: 'حمّل التطبيق الجديد الآن', fontFamily: 'Cairo', size: 0.085, fill: '#FFFFFF', fontWeight: 800 },
      { type: 'text', x: 0.5, y: 0.76, text: 'متوفر على Google Play', fontFamily: 'Tajawal', size: 0.042, fill: '#93C5FD' }
    ]
  }
];
