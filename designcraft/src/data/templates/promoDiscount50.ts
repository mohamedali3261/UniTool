import type { DesignTemplate } from './types';

export const promoDiscount50: DesignTemplate = {
  id: 'promo-discount-50',
  cat: 'promo',
  nameAr: 'فلاش خصم 50%',
  nameEn: '50% Off Blast',
  descAr: 'خلفية حمراء عميقة مع رقم ذهبي متوهج وزر تسوق واضح',
  descEn: 'Deep red scene with a glowing gold figure and a clear CTA',
  bg: '#7F1D1D',
  bg2: '#1C0505',
  baseW: 1080,
  baseH: 1080,
  objects: [
    { type: 'circle', x: 0.5, y: 0.42, size: 0.72, fill: '#EF4444', opacity: 0.18 },
    { type: 'circle', x: 0.5, y: 0.42, size: 0.5, fill: '#FCA5A5', opacity: 0.08 },

    { type: 'rect', x: 0.17, y: 0.27, w: 0.016, h: 0.016, fill: '#FBBF24', rotation: 45, opacity: 0.9 },
    { type: 'rect', x: 0.84, y: 0.6, w: 0.012, h: 0.012, fill: '#FCA5A5', rotation: 45, opacity: 0.8 },
    { type: 'rect', x: 0.24, y: 0.72, w: 0.01, h: 0.01, fill: '#FDE68A', rotation: 45, opacity: 0.7 },

    {
      type: 'rect', x: 0.5, y: 0.115, w: 0.3, h: 0.052, rx: 0.026,
      fill: '#FBBF24', fill2: '#F59E0B',
      shadow: { color: 'rgba(251,191,36,0.55)', blur: 0.03 }
    },
    { type: 'text', x: 0.5, y: 0.115, text: 'عرض محدود', fontFamily: 'Cairo', size: 0.027, fill: '#451A03', fontWeight: 900 },

    { type: 'text', x: 0.5, y: 0.235, text: 'خصم', fontFamily: 'Tajawal', size: 0.045, fill: '#FECACA', fontWeight: 700 },
    {
      type: 'text', x: 0.5, y: 0.4, text: '50%', fontFamily: 'Lalezar', size: 0.3,
      fill: '#FEF3C7', fill2: '#F59E0B',
      shadow: { color: 'rgba(245,158,11,0.55)', blur: 0.05 }
    },
    { type: 'text', x: 0.5, y: 0.575, text: 'على جميع منتجات المتجر', fontFamily: 'Tajawal', size: 0.042, fill: '#FEE2E2', fontWeight: 500 },
    { type: 'text', x: 0.5, y: 0.635, text: 'لفترة محدودة فقط', fontFamily: 'Tajawal', size: 0.03, fill: '#FCA5A5', opacity: 0.9 },

    {
      type: 'rect', x: 0.5, y: 0.775, w: 0.36, h: 0.078, rx: 0.039,
      fill: '#FFFFFF',
      shadow: { color: 'rgba(0,0,0,0.35)', blur: 0.03, offsetY: 0.008 }
    },
    { type: 'text', x: 0.5, y: 0.775, text: 'تسوق الآن', fontFamily: 'Cairo', size: 0.037, fill: '#7F1D1D', fontWeight: 900 },

    { type: 'rect', x: 0.5, y: 0.9, w: 0.2, h: 0.005, fill: '#FCA5A5', opacity: 0.5 }
  ]
};
