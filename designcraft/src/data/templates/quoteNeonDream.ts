import type { DesignTemplate } from './types';

export const quoteNeonDream: DesignTemplate = {
  id: 'quote-neon-dream',
  cat: 'quote',
  nameAr: 'حلم نيون',
  nameEn: 'Neon Dream Quote',
  descAr: 'اقتباس ليلي بتوهج سماوي ووردي وخط نيون رأسي وكلمة متدرجة',
  descEn: 'Night quote with cyan and pink glows, a vertical neon rule and a gradient word',
  isNew: true,
  bg: '#0B001A',
  bg2: '#2E1065',
  baseW: 1080,
  baseH: 1350,
  objects: [
    { type: 'circle', x: 0.18, y: 0.18, size: 0.85, fill: '#06B6D4', opacity: 0.12 },
    { type: 'circle', x: 0.86, y: 0.82, size: 0.75, fill: '#D946EF', opacity: 0.12 },

    {
      type: 'rect', x: 0.12, y: 0.5, w: 0.0035, h: 0.7, fill: '#22D3EE',
      shadow: { color: 'rgba(34,211,238,0.7)', blur: 0.03 }
    },
    { type: 'rect', x: 0.12, y: 0.1, w: 0.0035, h: 0.05, fill: '#E879F9' },
    { type: 'rect', x: 0.12, y: 0.9, w: 0.0035, h: 0.05, fill: '#E879F9' },

    { type: 'text', x: 0.5, y: 0.11, text: 'DREAM BIGGER', fontFamily: 'Montserrat', size: 0.026, fill: '#67E8F9', fontWeight: 700 },

    { type: 'text', x: 0.5, y: 0.33, w: 0.78, text: 'اصنع واقعًا\nلا يشبه\nغيرك', fontFamily: 'Cairo', size: 0.082, fill: '#F8FAFC', fontWeight: 900 },

    {
      type: 'text', x: 0.5, y: 0.6, text: 'DREAM', fontFamily: 'Montserrat', size: 0.13,
      fill: '#22D3EE', fill2: '#E879F9', fontWeight: 900
    },

    { type: 'rect', x: 0.5, y: 0.7, w: 0.13, h: 0.0035, fill: '#A78BFA', opacity: 0.8 },

    { type: 'text', x: 0.5, y: 0.765, text: '— ليلى الحربي', fontFamily: 'Tajawal', size: 0.032, fill: '#C4B5FD' },
    { type: 'text', x: 0.5, y: 0.805, text: 'كاتبة ومخرجة محتوى', fontFamily: 'Tajawal', size: 0.023, fill: '#8B5CF6' },

    { type: 'circle', x: 0.5, y: 0.92, size: 0.016, fill: '#22D3EE' },
    { type: 'circle', x: 0.455, y: 0.92, size: 0.016, fill: '#8B5CF6' },
    { type: 'circle', x: 0.545, y: 0.92, size: 0.016, fill: '#E879F9' }
  ]
};
