import type { DesignTemplate } from './types';

export const gpPhoneShopping: DesignTemplate = {
  id: 'gp-phone-shopping',
  cat: 'gp-phone',
  nameAr: 'لقطة هاتف — تسوق',
  nameEn: 'Phone Shot — Shopping',
  descAr: 'لقطة 1080×1920 لمتجر إلكتروني فاتح بشبكة منتجات وزر شراء',
  descEn: '1080×1920 light shopping screenshot with a product grid and buy CTA',
  isNew: true,
  exactSize: true,
  bg: '#1C1917',
  bg2: '#7C2D12',
  baseW: 1080,
  baseH: 1920,
  objects: [
    { type: 'circle', x: 0.5, y: 0.1, size: 1.1, fill: '#F97316', opacity: 0.14 },

    { type: 'text', x: 0.5, y: 0.075, w: 0.9, text: 'تسوّق بذكاء', fontFamily: 'Cairo', size: 0.075, fill: '#FFFFFF', fontWeight: 900 },
    { type: 'text', x: 0.5, y: 0.135, w: 0.9, text: 'أفضل العروض في مكان واحد', fontFamily: 'Tajawal', size: 0.03, fill: '#FED7AA' },

    {
      type: 'rect', x: 0.5, y: 0.58, w: 0.9, h: 0.8, rx: 0.045, fill: '#FFF7ED',
      shadow: { color: 'rgba(2,6,23,0.5)', blur: 0.05, offsetY: 0.012 }
    },

    { type: 'rect', x: 0.5, y: 0.215, w: 0.8, h: 0.06, rx: 0.03, fill: '#FFFFFF' },
    { type: 'text', x: 0.5, y: 0.215, text: 'ابحث عن منتج...', fontFamily: 'Tajawal', size: 0.022, fill: '#94A3B8' },

    { type: 'circle', x: 0.2, y: 0.32, size: 0.085, fill: '#FDBA74', opacity: 0.9 },
    { type: 'circle', x: 0.4, y: 0.32, size: 0.085, fill: '#FDBA74', opacity: 0.75 },
    { type: 'circle', x: 0.6, y: 0.32, size: 0.085, fill: '#FDBA74', opacity: 0.6 },
    { type: 'circle', x: 0.8, y: 0.32, size: 0.085, fill: '#FDBA74', opacity: 0.45 },
    { type: 'text', x: 0.2, y: 0.375, text: 'أزياء', fontFamily: 'Tajawal', size: 0.018, fill: '#7C2D12' },
    { type: 'text', x: 0.4, y: 0.375, text: 'إلكترونيات', fontFamily: 'Tajawal', size: 0.018, fill: '#7C2D12' },
    { type: 'text', x: 0.6, y: 0.375, text: 'منزل', fontFamily: 'Tajawal', size: 0.018, fill: '#7C2D12' },
    { type: 'text', x: 0.8, y: 0.375, text: 'رياضة', fontFamily: 'Tajawal', size: 0.018, fill: '#7C2D12' },

    { type: 'rect', x: 0.3, y: 0.49, w: 0.38, h: 0.15, rx: 0.03, fill: '#FFFFFF', shadow: { color: 'rgba(15,23,42,0.12)', blur: 0.02 } },
    { type: 'rect', x: 0.7, y: 0.49, w: 0.38, h: 0.15, rx: 0.03, fill: '#FFFFFF', shadow: { color: 'rgba(15,23,42,0.12)', blur: 0.02 } },
    { type: 'circle', x: 0.3, y: 0.455, size: 0.1, fill: '#FED7AA' },
    { type: 'circle', x: 0.7, y: 0.455, size: 0.1, fill: '#FDBA74' },
    { type: 'text', x: 0.3, y: 0.52, text: 'حقيبة جلدية', fontFamily: 'Tajawal', size: 0.021, fill: '#431407', fontWeight: 700 },
    { type: 'text', x: 0.7, y: 0.52, text: 'ساعة ذكية', fontFamily: 'Tajawal', size: 0.021, fill: '#431407', fontWeight: 700 },
    { type: 'text', x: 0.3, y: 0.555, text: '349 ج.م', fontFamily: 'Cairo', size: 0.026, fill: '#C2410C', fontWeight: 900 },
    { type: 'text', x: 0.7, y: 0.555, text: '1,290 ج.م', fontFamily: 'Cairo', size: 0.026, fill: '#C2410C', fontWeight: 900 },

    { type: 'rect', x: 0.3, y: 0.66, w: 0.38, h: 0.15, rx: 0.03, fill: '#FFFFFF', shadow: { color: 'rgba(15,23,42,0.12)', blur: 0.02 } },
    { type: 'rect', x: 0.7, y: 0.66, w: 0.38, h: 0.15, rx: 0.03, fill: '#FFFFFF', shadow: { color: 'rgba(15,23,42,0.12)', blur: 0.02 } },
    { type: 'circle', x: 0.3, y: 0.625, size: 0.1, fill: '#E7E5E4' },
    { type: 'circle', x: 0.7, y: 0.625, size: 0.1, fill: '#FCA5A5' },
    { type: 'text', x: 0.3, y: 0.69, text: 'طقم أكواب', fontFamily: 'Tajawal', size: 0.021, fill: '#431407', fontWeight: 700 },
    { type: 'text', x: 0.7, y: 0.69, text: 'حذاء رياضي', fontFamily: 'Tajawal', size: 0.021, fill: '#431407', fontWeight: 700 },
    { type: 'text', x: 0.3, y: 0.725, text: '189 ج.م', fontFamily: 'Cairo', size: 0.026, fill: '#C2410C', fontWeight: 900 },
    { type: 'text', x: 0.7, y: 0.725, text: '799 ج.م', fontFamily: 'Cairo', size: 0.026, fill: '#C2410C', fontWeight: 900 },

    {
      type: 'rect', x: 0.5, y: 0.87, w: 0.8, h: 0.065, rx: 0.0325, fill: '#F97316',
      shadow: { color: 'rgba(249,115,22,0.3)', blur: 0.03 }
    },
    { type: 'text', x: 0.5, y: 0.87, text: 'أكمل الشراء', fontFamily: 'Cairo', size: 0.026, fill: '#FFFFFF', fontWeight: 900 }
  ]
};
