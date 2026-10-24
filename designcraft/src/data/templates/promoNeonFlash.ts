import type { DesignTemplate } from './types';

export const promoNeonFlash: DesignTemplate = {
  id: 'promo-neon-flash',
  cat: 'promo',
  nameAr: 'فلاش سيل نيون',
  nameEn: 'Neon Flash Sale',
  descAr: 'خلفية داكنة بتوهجات سماوي وبنفسجي ورقم خصم متوهج',
  descEn: 'Dark scene with cyan/violet glows and a luminous discount figure',
  isNew: true,
  bg: '#020617',
  bg2: '#111827',
  baseW: 1080,
  baseH: 1080,
  objects: [
    { type: 'circle', x: 0.5, y: 0.48, size: 0.9, fill: '#22D3EE', opacity: 0.1 },
    { type: 'circle', x: 0.28, y: 0.3, size: 0.45, fill: '#D946EF', opacity: 0.12 },
    { type: 'circle', x: 0.76, y: 0.72, size: 0.5, fill: '#6366F1', opacity: 0.12 },

    { type: 'rect', x: 0.19, y: 0.55, w: 0.014, h: 0.014, fill: '#22D3EE', rotation: 45, shadow: { color: 'rgba(34,211,238,0.7)', blur: 0.02 } },
    { type: 'rect', x: 0.82, y: 0.32, w: 0.012, h: 0.012, fill: '#F0ABFC', rotation: 45 },
    { type: 'rect', x: 0.74, y: 0.66, w: 0.01, h: 0.01, fill: '#FFFFFF', rotation: 45, opacity: 0.8 },

    {
      type: 'rect', x: 0.5, y: 0.11, w: 0.3, h: 0.052, rx: 0.026,
      fill: '#22D3EE', fill2: '#8B5CF6',
      shadow: { color: 'rgba(34,211,238,0.5)', blur: 0.04 }
    },
    { type: 'text', x: 0.5, y: 0.11, text: 'FLASH SALE', fontFamily: 'Montserrat', size: 0.023, fill: '#020617', fontWeight: 900 },

    { type: 'text', x: 0.5, y: 0.235, text: 'خصم يصل إلى', fontFamily: 'Tajawal', size: 0.04, fill: '#A5F3FC', fontWeight: 600 },
    {
      type: 'text', x: 0.5, y: 0.405, text: '70%', fontFamily: 'Lalezar', size: 0.31,
      fill: '#FFFFFF', fill2: '#22D3EE',
      shadow: { color: 'rgba(34,211,238,0.6)', blur: 0.06 }
    },
    { type: 'text', x: 0.5, y: 0.59, text: 'لمدة 24 ساعة فقط', fontFamily: 'Cairo', size: 0.048, fill: '#E9D5FF', fontWeight: 700 },

    {
      type: 'rect', x: 0.5, y: 0.745, w: 0.42, h: 0.075, rx: 0.0375,
      fill: '#D946EF', fill2: '#8B5CF6',
      shadow: { color: 'rgba(168,85,247,0.6)', blur: 0.05 }
    },
    { type: 'text', x: 0.5, y: 0.745, text: 'اغتنم العرض الآن', fontFamily: 'Cairo', size: 0.035, fill: '#FFFFFF', fontWeight: 900 },

    { type: 'text', x: 0.5, y: 0.87, text: 'على كل الأقسام · أونلاين فقط', fontFamily: 'Tajawal', size: 0.026, fill: '#94A3B8' }
  ]
};
