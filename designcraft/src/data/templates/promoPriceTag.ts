import type { DesignTemplate } from './types';

export const promoPriceTag: DesignTemplate = {
  id: 'promo-price-tag',
  cat: 'promo',
  nameAr: 'تاج سعر وخصم',
  nameEn: 'Price & Deal Card',
  descAr: 'سعر كبير مع سعر قديم مشطوب وشارة خصم دائرية',
  descEn: 'Big price, struck-through old price and a round sale badge',
  bg: '#F8FAFC',
  bg2: '#E2E8F0',
  baseW: 1080,
  baseH: 1080,
  objects: [
    { type: 'rect', x: 0.5, y: 0.03, w: 1, h: 0.014, fill: '#0EA5E9', fill2: '#6366F1' },

    { type: 'rect', x: 0.5, y: 0.15, w: 0.22, h: 0.056, rx: 0.028, fill: '#E0F2FE' },
    { type: 'text', x: 0.5, y: 0.15, text: 'عرض خاص', fontFamily: 'Cairo', size: 0.03, fill: '#0284C7', fontWeight: 700 },

    { type: 'text', x: 0.5, y: 0.35, text: '99 ج.م', fontFamily: 'Lalezar', size: 0.17, fill: '#0F172A' },
    { type: 'text', x: 0.5, y: 0.51, text: 'بدلاً من 199 ج.م', fontFamily: 'Tajawal', size: 0.046, fill: '#94A3B8', fontWeight: 500 },
    { type: 'rect', x: 0.5, y: 0.51, w: 0.155, h: 0.006, fill: '#F43F5E', rotation: -3 },

    { type: 'rect', x: 0.5, y: 0.6, w: 0.28, h: 0.004, fill: '#CBD5E1' },

    { type: 'text', x: 0.5, y: 0.68, w: 0.7, text: 'جودة عالية · شحن سريع\nضمان استرجاع 14 يوم', fontFamily: 'Tajawal', size: 0.034, fill: '#475569' },

    {
      type: 'rect', x: 0.5, y: 0.82, w: 0.44, h: 0.068, rx: 0.034,
      fill: '#0EA5E9', fill2: '#2563EB',
      shadow: { color: 'rgba(37,99,235,0.4)', blur: 0.04, offsetY: 0.01 }
    },
    { type: 'text', x: 0.5, y: 0.82, text: 'اطلب الآن', fontFamily: 'Cairo', size: 0.036, fill: '#FFFFFF', fontWeight: 800 },

    {
      type: 'circle', x: 0.84, y: 0.155, size: 0.145, fill: '#F43F5E',
      shadow: { color: 'rgba(244,63,94,0.45)', blur: 0.035 }
    },
    { type: 'text', x: 0.84, y: 0.155, w: 0.18, text: 'خصم\n50%', fontFamily: 'Cairo', size: 0.028, fill: '#FFFFFF', fontWeight: 900 }
  ]
};
