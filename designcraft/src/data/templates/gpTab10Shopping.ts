import type { DesignTemplate } from './types';

export const gpTab10Shopping: DesignTemplate = {
  id: 'gp-tab10-shopping',
  cat: 'gp-tablet10',
  nameAr: 'تابلت 10 — تسوق',
  nameEn: '10" Tablet — Shopping',
  descAr: 'لقطة 1600×2560 لمتجر بأربعة أعمدة منتجات وفئات',
  descEn: '1600×2560 store screenshot with four product columns and categories',
  isNew: true,
  exactSize: true,
  bg: '#1C1917',
  bg2: '#7C2D12',
  baseW: 1600,
  baseH: 2560,
  objects: [
    { type: 'circle', x: 0.5, y: 0.1, size: 1, fill: '#F97316', opacity: 0.14 },

    { type: 'text', x: 0.5, y: 0.055, w: 0.9, text: 'تسوّق\nبذكاء', fontFamily: 'Cairo', size: 0.055, fill: '#FFFFFF', fontWeight: 900 },
    { type: 'text', x: 0.5, y: 0.115, w: 0.9, text: 'أفضل العروض في مكان واحد', fontFamily: 'Tajawal', size: 0.023, fill: '#FED7AA' },

    {
      type: 'rect', x: 0.5, y: 0.57, w: 0.94, h: 0.82, rx: 0.03, fill: '#FFF7ED',
      shadow: { color: 'rgba(2,6,23,0.5)', blur: 0.04, offsetY: 0.01 }
    },

    { type: 'rect', x: 0.5, y: 0.195, w: 0.86, h: 0.05, rx: 0.025, fill: '#FFFFFF' },
    { type: 'text', x: 0.5, y: 0.195, text: 'ابحث عن منتج...', fontFamily: 'Tajawal', size: 0.016, fill: '#94A3B8' },

    { type: 'circle', x: 0.2, y: 0.29, size: 0.07, fill: '#FDBA74', opacity: 0.9 },
    { type: 'circle', x: 0.4, y: 0.29, size: 0.07, fill: '#FDBA74', opacity: 0.75 },
    { type: 'circle', x: 0.6, y: 0.29, size: 0.07, fill: '#FDBA74', opacity: 0.6 },
    { type: 'circle', x: 0.8, y: 0.29, size: 0.07, fill: '#FDBA74', opacity: 0.45 },
    { type: 'text', x: 0.2, y: 0.33, text: 'أزياء', fontFamily: 'Tajawal', size: 0.015, fill: '#7C2D12' },
    { type: 'text', x: 0.4, y: 0.33, text: 'إلكترونيات', fontFamily: 'Tajawal', size: 0.015, fill: '#7C2D12' },
    { type: 'text', x: 0.6, y: 0.33, text: 'منزل', fontFamily: 'Tajawal', size: 0.015, fill: '#7C2D12' },
    { type: 'text', x: 0.8, y: 0.33, text: 'رياضة', fontFamily: 'Tajawal', size: 0.015, fill: '#7C2D12' },

    { type: 'rect', x: 0.2, y: 0.47, w: 0.17, h: 0.16, rx: 0.025, fill: '#FFFFFF', shadow: { color: 'rgba(15,23,42,0.12)', blur: 0.015 } },
    { type: 'rect', x: 0.4, y: 0.47, w: 0.17, h: 0.16, rx: 0.025, fill: '#FFFFFF', shadow: { color: 'rgba(15,23,42,0.12)', blur: 0.015 } },
    { type: 'rect', x: 0.6, y: 0.47, w: 0.17, h: 0.16, rx: 0.025, fill: '#FFFFFF', shadow: { color: 'rgba(15,23,42,0.12)', blur: 0.015 } },
    { type: 'rect', x: 0.8, y: 0.47, w: 0.17, h: 0.16, rx: 0.025, fill: '#FFFFFF', shadow: { color: 'rgba(15,23,42,0.12)', blur: 0.015 } },
    { type: 'circle', x: 0.2, y: 0.42, size: 0.07, fill: '#FED7AA' },
    { type: 'circle', x: 0.4, y: 0.42, size: 0.07, fill: '#FDBA74' },
    { type: 'circle', x: 0.6, y: 0.42, size: 0.07, fill: '#E7E5E4' },
    { type: 'circle', x: 0.8, y: 0.42, size: 0.07, fill: '#FCA5A5' },
    { type: 'text', x: 0.2, y: 0.5, text: 'حقيبة', fontFamily: 'Tajawal', size: 0.015, fill: '#431407', fontWeight: 700 },
    { type: 'text', x: 0.4, y: 0.5, text: 'ساعة', fontFamily: 'Tajawal', size: 0.015, fill: '#431407', fontWeight: 700 },
    { type: 'text', x: 0.6, y: 0.5, text: 'أكواب', fontFamily: 'Tajawal', size: 0.015, fill: '#431407', fontWeight: 700 },
    { type: 'text', x: 0.8, y: 0.5, text: 'حذاء', fontFamily: 'Tajawal', size: 0.015, fill: '#431407', fontWeight: 700 },
    { type: 'text', x: 0.2, y: 0.525, text: '349 ج.م', fontFamily: 'Cairo', size: 0.018, fill: '#C2410C', fontWeight: 900 },
    { type: 'text', x: 0.4, y: 0.525, text: '1,290 ج.م', fontFamily: 'Cairo', size: 0.018, fill: '#C2410C', fontWeight: 900 },
    { type: 'text', x: 0.6, y: 0.525, text: '189 ج.م', fontFamily: 'Cairo', size: 0.018, fill: '#C2410C', fontWeight: 900 },
    { type: 'text', x: 0.8, y: 0.525, text: '799 ج.م', fontFamily: 'Cairo', size: 0.018, fill: '#C2410C', fontWeight: 900 },

    { type: 'rect', x: 0.2, y: 0.67, w: 0.17, h: 0.16, rx: 0.025, fill: '#FFFFFF', shadow: { color: 'rgba(15,23,42,0.12)', blur: 0.015 } },
    { type: 'rect', x: 0.4, y: 0.67, w: 0.17, h: 0.16, rx: 0.025, fill: '#FFFFFF', shadow: { color: 'rgba(15,23,42,0.12)', blur: 0.015 } },
    { type: 'rect', x: 0.6, y: 0.67, w: 0.17, h: 0.16, rx: 0.025, fill: '#FFFFFF', shadow: { color: 'rgba(15,23,42,0.12)', blur: 0.015 } },
    { type: 'rect', x: 0.8, y: 0.67, w: 0.17, h: 0.16, rx: 0.025, fill: '#FFFFFF', shadow: { color: 'rgba(15,23,42,0.12)', blur: 0.015 } },
    { type: 'circle', x: 0.2, y: 0.62, size: 0.07, fill: '#C7D2FE' },
    { type: 'circle', x: 0.4, y: 0.62, size: 0.07, fill: '#A7F3D0' },
    { type: 'circle', x: 0.6, y: 0.62, size: 0.07, fill: '#FBCFE8' },
    { type: 'circle', x: 0.8, y: 0.62, size: 0.07, fill: '#FDE68A' },
    { type: 'text', x: 0.2, y: 0.7, text: 'سماعات', fontFamily: 'Tajawal', size: 0.015, fill: '#431407', fontWeight: 700 },
    { type: 'text', x: 0.4, y: 0.7, text: 'نظارة', fontFamily: 'Tajawal', size: 0.015, fill: '#431407', fontWeight: 700 },
    { type: 'text', x: 0.6, y: 0.7, text: 'عطر', fontFamily: 'Tajawal', size: 0.015, fill: '#431407', fontWeight: 700 },
    { type: 'text', x: 0.8, y: 0.7, text: 'سجادة', fontFamily: 'Tajawal', size: 0.015, fill: '#431407', fontWeight: 700 },
    { type: 'text', x: 0.2, y: 0.725, text: '599 ج.م', fontFamily: 'Cairo', size: 0.018, fill: '#C2410C', fontWeight: 900 },
    { type: 'text', x: 0.4, y: 0.725, text: '249 ج.م', fontFamily: 'Cairo', size: 0.018, fill: '#C2410C', fontWeight: 900 },
    { type: 'text', x: 0.6, y: 0.725, text: '420 ج.م', fontFamily: 'Cairo', size: 0.018, fill: '#C2410C', fontWeight: 900 },
    { type: 'text', x: 0.8, y: 0.725, text: '310 ج.م', fontFamily: 'Cairo', size: 0.018, fill: '#C2410C', fontWeight: 900 },

    { type: 'rect', x: 0.5, y: 0.88, w: 0.28, h: 0.055, rx: 0.0275, fill: '#F97316', shadow: { color: 'rgba(249,115,22,0.3)', blur: 0.02 } },
    { type: 'text', x: 0.5, y: 0.88, text: 'أكمل الشراء', fontFamily: 'Cairo', size: 0.018, fill: '#FFFFFF', fontWeight: 900 }
  ]
};
