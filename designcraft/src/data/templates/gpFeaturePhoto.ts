import type { DesignTemplate } from './types';

export const gpFeaturePhoto: DesignTemplate = {
  id: 'gp-feature-photo',
  cat: 'gp-feature',
  nameAr: 'بنر فلاتر تصوير',
  nameEn: 'Photo Filters Banner',
  descAr: 'بنر 1024×500 وردي-بنفسجي بعدسة دائرية وزر أبيض',
  descEn: '1024×500 pink-violet banner with a circular lens and white CTA',
  isNew: true,
  exactSize: true,
  bg: '#7C3AED',
  bg2: '#DB2777',
  baseW: 1024,
  baseH: 500,
  objects: [
    { type: 'circle', x: 0.86, y: 0.5, size: 0.6, fill: '#FFFFFF', opacity: 0.12 },
    { type: 'circle', x: 0.86, y: 0.5, size: 0.34, fill: '#FFFFFF', opacity: 0.18 },
    { type: 'circle', x: 0.86, y: 0.5, size: 0.22, fill: '#FFFFFF', opacity: 0.22 },
    { type: 'circle', x: 0.9, y: 0.44, size: 0.06, fill: '#FFFFFF', opacity: 0.9 },

    { type: 'text', x: 0.38, y: 0.35, w: 0.55, text: 'عدّس صورتك\nباحتراف', fontFamily: 'Cairo', size: 0.082, fill: '#FFFFFF', fontWeight: 900 },
    { type: 'text', x: 0.38, y: 0.55, w: 0.5, text: 'فلاتر ذكية وأدوات تحرير فورية', fontFamily: 'Tajawal', size: 0.032, fill: '#FBCFE8' },

    {
      type: 'rect', x: 0.38, y: 0.76, w: 0.25, h: 0.1, rx: 0.05, fill: '#FFFFFF',
      shadow: { color: 'rgba(0,0,0,0.25)', blur: 0.03, offsetY: 0.012 }
    },
    { type: 'text', x: 0.38, y: 0.76, text: 'حمّل التطبيق', fontFamily: 'Cairo', size: 0.03, fill: '#7C3AED', fontWeight: 900 },

    { type: 'rect', x: 0.86, y: 0.8, w: 0.2, h: 0.05, rx: 0.025, fill: '#FFFFFF', opacity: 0.18 },
    { type: 'text', x: 0.86, y: 0.8, text: 'Pro filters', fontFamily: 'Cairo', size: 0.018, fill: '#FFFFFF', fontWeight: 700 }
  ]
};
