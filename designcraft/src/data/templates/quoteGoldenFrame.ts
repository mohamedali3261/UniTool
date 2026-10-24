import type { DesignTemplate } from './types';

export const quoteGoldenFrame: DesignTemplate = {
  id: 'quote-golden-frame',
  cat: 'quote',
  nameAr: 'اقتباس الإطار الذهبي',
  nameEn: 'Golden Frame Quote',
  descAr: 'بوستر اقتباس فاخر بإطار ذهبي مزدوج وخط عربي أنيق',
  descEn: 'Luxury quote poster with a double gold frame and refined Arabic type',
  isNew: true,
  bg: '#0C0A09',
  bg2: '#1C1917',
  baseW: 1080,
  baseH: 1350,
  objects: [
    { type: 'circle', x: 0.5, y: 0.42, size: 0.65, fill: '#F59E0B', opacity: 0.08 },

    { type: 'rect', x: 0.5, y: 0.07, w: 0.82, h: 0.0035, fill: '#FBBF24', opacity: 0.55 },
    { type: 'rect', x: 0.5, y: 0.93, w: 0.82, h: 0.0035, fill: '#FBBF24', opacity: 0.55 },
    { type: 'rect', x: 0.09, y: 0.5, w: 0.0035, h: 0.86, fill: '#FBBF24', opacity: 0.55 },
    { type: 'rect', x: 0.91, y: 0.5, w: 0.0035, h: 0.86, fill: '#FBBF24', opacity: 0.55 },

    { type: 'rect', x: 0.5, y: 0.105, w: 0.72, h: 0.0025, fill: '#FBBF24', opacity: 0.25 },
    { type: 'rect', x: 0.5, y: 0.895, w: 0.72, h: 0.0025, fill: '#FBBF24', opacity: 0.25 },
    { type: 'rect', x: 0.12, y: 0.5, w: 0.0025, h: 0.79, fill: '#FBBF24', opacity: 0.25 },
    { type: 'rect', x: 0.88, y: 0.5, w: 0.0025, h: 0.79, fill: '#FBBF24', opacity: 0.25 },

    { type: 'text', x: 0.5, y: 0.16, text: 'حكمة اليوم', fontFamily: 'Tajawal', size: 0.028, fill: '#D6D3D1' },
    { type: 'text', x: 0.5, y: 0.27, text: '”', fontFamily: 'Amiri', size: 0.16, fill: '#FBBF24', opacity: 0.7 },
    { type: 'text', x: 0.5, y: 0.45, w: 0.76, text: 'اصنع لنفسك\nطريقًا لا يشبه\nأحدًا آخر', fontFamily: 'Amiri', size: 0.078, fill: '#FAFAF9' },

    { type: 'rect', x: 0.5, y: 0.635, w: 0.12, h: 0.004, fill: '#FBBF24' },

    { type: 'text', x: 0.5, y: 0.7, text: '— نورة العتيبي', fontFamily: 'Tajawal', size: 0.033, fill: '#E7E5E4' },
    { type: 'text', x: 0.5, y: 0.745, text: 'مصممة ومؤسِّسة', fontFamily: 'Tajawal', size: 0.024, fill: '#A8A29E' },

    { type: 'rect', x: 0.5, y: 0.87, w: 0.011, h: 0.0088, fill: '#FBBF24', rotation: 45 }
  ]
};
