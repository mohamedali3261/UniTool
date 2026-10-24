import type { DesignTemplate } from './types';

export const gpTab7Shopping: DesignTemplate = {
  id: 'gp-tab7-shopping',
  cat: 'gp-tablet7',
  nameAr: 'تابلت 7 — تسوق',
  nameEn: '7" Tablet — Shopping',
  descAr: 'لقطة 1200×1920 لمتجر بشبكة منتجات ثلاثة أعمدة',
  descEn: '1200×1920 store screenshot with a three-column product grid',
  isNew: true,
  exactSize: true,
  bg: '#1C1917',
  bg2: '#7C2D12',
  baseW: 1200,
  baseH: 1920,
  objects: [
    { type: 'circle', x: 0.5, y: 0.1, size: 1, fill: '#F97316', opacity: 0.14 },

    { type: 'text', x: 0.5, y: 0.07, w: 0.9, text: 'عروض\nالموسم', fontFamily: 'Cairo', size: 0.062, fill: '#FFFFFF', fontWeight: 900 },
    { type: 'text', x: 0.5, y: 0.135, w: 0.9, text: 'خصومات تصل إلى 50%', fontFamily: 'Tajawal', size: 0.026, fill: '#FED7AA' },

    {
      type: 'rect', x: 0.5, y: 0.585, w: 0.94, h: 0.79, rx: 0.04, fill: '#FFF7ED',
      shadow: { color: 'rgba(2,6,23,0.5)', blur: 0.045, offsetY: 0.012 }
    },

    { type: 'rect', x: 0.5, y: 0.22, w: 0.84, h: 0.055, rx: 0.0275, fill: '#FFFFFF' },
    { type: 'text', x: 0.5, y: 0.22, text: 'ابحث عن منتج...', fontFamily: 'Tajawal', size: 0.018, fill: '#94A3B8' },

    { type: 'rect', x: 0.22, y: 0.4, w: 0.24, h: 0.2, rx: 0.03, fill: '#FFFFFF', shadow: { color: 'rgba(15,23,42,0.12)', blur: 0.02 } },
    { type: 'rect', x: 0.5, y: 0.4, w: 0.24, h: 0.2, rx: 0.03, fill: '#FFFFFF', shadow: { color: 'rgba(15,23,42,0.12)', blur: 0.02 } },
    { type: 'rect', x: 0.78, y: 0.4, w: 0.24, h: 0.2, rx: 0.03, fill: '#FFFFFF', shadow: { color: 'rgba(15,23,42,0.12)', blur: 0.02 } },
    { type: 'circle', x: 0.22, y: 0.36, size: 0.08, fill: '#FED7AA' },
    { type: 'circle', x: 0.5, y: 0.36, size: 0.08, fill: '#FDBA74' },
    { type: 'circle', x: 0.78, y: 0.36, size: 0.08, fill: '#E7E5E4' },
    { type: 'text', x: 0.22, y: 0.44, text: 'حقيبة', fontFamily: 'Tajawal', size: 0.017, fill: '#431407', fontWeight: 700 },
    { type: 'text', x: 0.5, y: 0.44, text: 'ساعة', fontFamily: 'Tajawal', size: 0.017, fill: '#431407', fontWeight: 700 },
    { type: 'text', x: 0.78, y: 0.44, text: 'حذاء', fontFamily: 'Tajawal', size: 0.017, fill: '#431407', fontWeight: 700 },
    { type: 'text', x: 0.22, y: 0.47, text: '349 ج.م', fontFamily: 'Cairo', size: 0.02, fill: '#C2410C', fontWeight: 900 },
    { type: 'text', x: 0.5, y: 0.47, text: '1,290 ج.م', fontFamily: 'Cairo', size: 0.02, fill: '#C2410C', fontWeight: 900 },
    { type: 'text', x: 0.78, y: 0.47, text: '799 ج.م', fontFamily: 'Cairo', size: 0.02, fill: '#C2410C', fontWeight: 900 },

    { type: 'rect', x: 0.22, y: 0.65, w: 0.24, h: 0.2, rx: 0.03, fill: '#FFFFFF', shadow: { color: 'rgba(15,23,42,0.12)', blur: 0.02 } },
    { type: 'rect', x: 0.5, y: 0.65, w: 0.24, h: 0.2, rx: 0.03, fill: '#FFFFFF', shadow: { color: 'rgba(15,23,42,0.12)', blur: 0.02 } },
    { type: 'rect', x: 0.78, y: 0.65, w: 0.24, h: 0.2, rx: 0.03, fill: '#FFFFFF', shadow: { color: 'rgba(15,23,42,0.12)', blur: 0.02 } },
    { type: 'circle', x: 0.22, y: 0.61, size: 0.08, fill: '#FCA5A5' },
    { type: 'circle', x: 0.5, y: 0.61, size: 0.08, fill: '#C7D2FE' },
    { type: 'circle', x: 0.78, y: 0.61, size: 0.08, fill: '#A7F3D0' },
    { type: 'text', x: 0.22, y: 0.69, text: 'طقم أكواب', fontFamily: 'Tajawal', size: 0.017, fill: '#431407', fontWeight: 700 },
    { type: 'text', x: 0.5, y: 0.69, text: 'سماعات', fontFamily: 'Tajawal', size: 0.017, fill: '#431407', fontWeight: 700 },
    { type: 'text', x: 0.78, y: 0.69, text: 'نظارة', fontFamily: 'Tajawal', size: 0.017, fill: '#431407', fontWeight: 700 },
    { type: 'text', x: 0.22, y: 0.72, text: '189 ج.م', fontFamily: 'Cairo', size: 0.02, fill: '#C2410C', fontWeight: 900 },
    { type: 'text', x: 0.5, y: 0.72, text: '599 ج.م', fontFamily: 'Cairo', size: 0.02, fill: '#C2410C', fontWeight: 900 },
    { type: 'text', x: 0.78, y: 0.72, text: '249 ج.م', fontFamily: 'Cairo', size: 0.02, fill: '#C2410C', fontWeight: 900 },

    { type: 'rect', x: 0.5, y: 0.87, w: 0.34, h: 0.06, rx: 0.03, fill: '#F97316', shadow: { color: 'rgba(249,115,22,0.3)', blur: 0.025 } },
    { type: 'text', x: 0.5, y: 0.87, text: 'تسوّق الآن', fontFamily: 'Cairo', size: 0.02, fill: '#FFFFFF', fontWeight: 900 }
  ]
};
