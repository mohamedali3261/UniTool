import type { DesignTemplate } from './types';

export const eventPlayBanner: DesignTemplate = {
  id: 'event-banner-play',
  cat: 'event',
  nameAr: 'بانر جوجل بلاي',
  nameEn: 'Google Play Banner',
  descAr: 'بنر 1024×500 بلمسة أخضر نيون وزر تحميل واضح',
  descEn: '1024×500 banner with a neon green accent and a clear download pill',
  bg: '#0B132B',
  bg2: '#12234F',
  baseW: 1024,
  baseH: 500,
  objects: [
    { type: 'circle', x: 0.2, y: 0.5, size: 0.6, fill: '#3DDC84', opacity: 0.1 },

    { type: 'rect', x: 0.5, y: 0.12, w: 0.3, h: 0.012, rx: 0.006, fill: '#3DDC84', fill2: '#22D3EE' },
    { type: 'rect', x: 0.03, y: 0.5, w: 0.006, h: 0.5, fill: '#3DDC84', opacity: 0.5 },
    { type: 'rect', x: 0.97, y: 0.5, w: 0.006, h: 0.5, fill: '#3DDC84', opacity: 0.5 },

    { type: 'text', x: 0.5, y: 0.4, w: 0.9, text: 'حمّل التطبيق الجديد الآن', fontFamily: 'Cairo', size: 0.062, fill: '#FFFFFF', fontWeight: 800 },
    { type: 'text', x: 0.5, y: 0.58, text: 'أسرع · أسهل · مجاني بالكامل', fontFamily: 'Tajawal', size: 0.038, fill: '#93C5FD' },

    {
      type: 'rect', x: 0.5, y: 0.79, w: 0.34, h: 0.115, rx: 0.0575,
      fill: '#3DDC84', fill2: '#22D3EE',
      shadow: { color: 'rgba(61,220,132,0.4)', blur: 0.04 }
    },
    { type: 'text', x: 0.5, y: 0.79, text: 'متوفر على Google Play', fontFamily: 'Cairo', size: 0.034, fill: '#052E16', fontWeight: 900 }
  ]
};
