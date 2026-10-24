import type { DesignTemplate } from './types';

export const socialStorySale: DesignTemplate = {
  id: 'social-story-sale',
  cat: 'social',
  nameAr: 'ستوري عرض مغري',
  nameEn: 'Story Splash Sale',
  descAr: 'تدرج وردي-بنفسجي مع دائرة خصم ذهبية وزر واضح',
  descEn: 'Pink-to-violet story with a golden discount coin and CTA',
  bg: '#DB2777',
  bg2: '#4C1D95',
  baseW: 1080,
  baseH: 1920,
  objects: [
    { type: 'circle', x: 0.5, y: 0.5, size: 1.05, fill: '#7C3AED', opacity: 0.22 },
    { type: 'circle', x: 0.12, y: 0.22, size: 0.5, fill: '#FFFFFF', opacity: 0.07 },
    { type: 'circle', x: 0.88, y: 0.8, size: 0.55, fill: '#FDE047', opacity: 0.08 },

    { type: 'rect', x: 0.5, y: 0.1, w: 0.34, h: 0.042, rx: 0.021, fill: '#FFFFFF', opacity: 0.16 },
    { type: 'text', x: 0.5, y: 0.1, text: 'NEW SEASON', fontFamily: 'Montserrat', size: 0.024, fill: '#FFFFFF', fontWeight: 700 },

    { type: 'text', x: 0.5, y: 0.3, w: 0.8, text: 'عرض نهاية\nالأسبوع', fontFamily: 'Cairo', size: 0.105, fill: '#FFFFFF', fontWeight: 900 },
    { type: 'rect', x: 0.5, y: 0.405, w: 0.18, h: 0.006, fill: '#FDE047' },
    { type: 'text', x: 0.5, y: 0.48, w: 0.72, text: 'خصومات تصل إلى 60%\nعلى كل ما هو جديد', fontFamily: 'Tajawal', size: 0.05, fill: '#FBCFE8' },

    {
      type: 'circle', x: 0.5, y: 0.68, size: 0.3,
      fill: '#FDE047', fill2: '#F59E0B',
      shadow: { color: 'rgba(245,158,11,0.5)', blur: 0.05 }
    },
    { type: 'text', x: 0.5, y: 0.675, text: '60%\nخصم', fontFamily: 'Cairo', size: 0.075, fill: '#4C1D95', fontWeight: 900 },

    { type: 'rect', x: 0.5, y: 0.86, w: 0.42, h: 0.058, rx: 0.029, fill: '#FFFFFF' },
    { type: 'text', x: 0.5, y: 0.86, text: 'اكتشف العرض', fontFamily: 'Cairo', size: 0.034, fill: '#7C3AED', fontWeight: 800 },

    { type: 'text', x: 0.5, y: 0.935, text: 'لفترة محدودة · أونلاين فقط', fontFamily: 'Tajawal', size: 0.024, fill: '#FFFFFF', opacity: 0.75 }
  ]
};
