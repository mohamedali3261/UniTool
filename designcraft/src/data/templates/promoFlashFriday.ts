import type { DesignTemplate } from './types';

export const promoFlashFriday: DesignTemplate = {
  id: 'promo-flash-friday',
  cat: 'promo',
  nameAr: 'جمعة الفلاش',
  nameEn: 'Flash Friday',
  descAr: 'خلفية داكنة بخطوط لايم مائلة ورقم خصم ضخم وزر شراء صارخ',
  descEn: 'Dark poster with skewed lime stripes, a huge discount figure and a punchy CTA',
  isNew: true,
  bg: '#020617',
  bg2: '#0F172A',
  baseW: 1080,
  baseH: 1080,
  objects: [
    { type: 'circle', x: 0.82, y: 0.16, size: 0.6, fill: '#A3E635', opacity: 0.08 },
    { type: 'circle', x: 0.12, y: 0.88, size: 0.5, fill: '#22D3EE', opacity: 0.06 },

    { type: 'rect', x: 0.5, y: 0.14, w: 1.5, h: 0.055, fill: '#A3E635', opacity: 0.07, rotation: -16 },
    { type: 'rect', x: 0.5, y: 0.5, w: 1.5, h: 0.03, fill: '#22D3EE', opacity: 0.06, rotation: -16 },
    { type: 'rect', x: 0.5, y: 0.86, w: 1.5, h: 0.05, fill: '#A3E635', opacity: 0.06, rotation: -16 },

    { type: 'rect', x: 0.5, y: 0.115, w: 0.3, h: 0.058, rx: 0.029, fill: '#A3E635' },
    { type: 'text', x: 0.5, y: 0.115, text: 'FLASH FRIDAY', fontFamily: 'Montserrat', size: 0.03, fill: '#052E16', fontWeight: 900 },

    { type: 'text', x: 0.5, y: 0.26, text: 'خصم', fontFamily: 'Cairo', size: 0.07, fill: '#E2E8F0', fontWeight: 700 },
    { type: 'text', x: 0.5, y: 0.43, text: '70%', fontFamily: 'Lalezar', size: 0.25, fill: '#A3E635', fontWeight: 400 },
    { type: 'text', x: 0.5, y: 0.58, text: 'على كل الأقسام', fontFamily: 'Tajawal', size: 0.045, fill: '#94A3B8', fontWeight: 500 },

    { type: 'rect', x: 0.5, y: 0.645, w: 0.16, h: 0.005, fill: '#A3E635', opacity: 0.8 },

    { type: 'text', x: 0.5, y: 0.7, w: 0.8, text: 'اليوم فقط · أونلاين وحصريًا', fontFamily: 'Tajawal', size: 0.032, fill: '#CBD5E1' },

    {
      type: 'rect', x: 0.5, y: 0.82, w: 0.46, h: 0.075, rx: 0.0375,
      fill: '#A3E635', fill2: '#22D3EE',
      shadow: { color: 'rgba(163,230,53,0.4)', blur: 0.05, offsetY: 0.012 }
    },
    { type: 'text', x: 0.5, y: 0.82, text: 'تسوّق الآن', fontFamily: 'Cairo', size: 0.038, fill: '#052E16', fontWeight: 900 },

    { type: 'text', x: 0.5, y: 0.93, text: 'الكميات محدودة · لا تفوّت الفرصة', fontFamily: 'Tajawal', size: 0.024, fill: '#64748B' }
  ]
};
