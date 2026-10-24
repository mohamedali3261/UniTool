import type { DesignTemplate } from './types';

export const quoteMidnight: DesignTemplate = {
  id: 'quote-night',
  cat: 'quote',
  nameAr: 'منشور اقتباس ليلي',
  nameEn: 'Midnight Quote Post',
  descAr: 'اقتباس أنيق داخل إطار ذهبي رفيع على خلفية ليلية',
  descEn: 'Elegant quote inside a thin gold frame on a night backdrop',
  bg: '#0B1020',
  bg2: '#1E1B4B',
  baseW: 1080,
  baseH: 1080,
  objects: [
    { type: 'circle', x: 0.5, y: 0.44, size: 0.62, fill: '#FBBF24', opacity: 0.07 },

    { type: 'rect', x: 0.5, y: 0.065, w: 0.84, h: 0.004, fill: '#FBBF24', opacity: 0.45 },
    { type: 'rect', x: 0.5, y: 0.935, w: 0.84, h: 0.004, fill: '#FBBF24', opacity: 0.45 },
    { type: 'rect', x: 0.08, y: 0.5, w: 0.004, h: 0.87, fill: '#FBBF24', opacity: 0.45 },
    { type: 'rect', x: 0.92, y: 0.5, w: 0.004, h: 0.87, fill: '#FBBF24', opacity: 0.45 },

    { type: 'text', x: 0.5, y: 0.15, text: 'اقتباس اليوم', fontFamily: 'Tajawal', size: 0.03, fill: '#94A3B8' },
    { type: 'text', x: 0.5, y: 0.26, text: '”', fontFamily: 'Amiri', size: 0.17, fill: '#FBBF24', opacity: 0.55 },
    { type: 'text', x: 0.5, y: 0.44, w: 0.8, text: 'النجاح رحلة\nوليس وجهة', fontFamily: 'Amiri', size: 0.095, fill: '#F8FAFC' },

    { type: 'rect', x: 0.5, y: 0.585, w: 0.14, h: 0.004, fill: '#FBBF24' },

    { type: 'text', x: 0.5, y: 0.655, text: '— سعيد بن أحمد', fontFamily: 'Tajawal', size: 0.035, fill: '#CBD5E1' },
    { type: 'text', x: 0.5, y: 0.705, text: 'رجل أعمال ومحاضر', fontFamily: 'Tajawal', size: 0.025, fill: '#94A3B8' },

    { type: 'rect', x: 0.43, y: 0.865, w: 0.009, h: 0.009, fill: '#FBBF24', rotation: 45, opacity: 0.8 },
    { type: 'rect', x: 0.57, y: 0.865, w: 0.009, h: 0.009, fill: '#FBBF24', rotation: 45, opacity: 0.8 }
  ]
};
