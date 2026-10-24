import type { DesignTemplate } from './types';

export const gpFeatureGaming: DesignTemplate = {
  id: 'gp-feature-gaming',
  cat: 'gp-feature',
  nameAr: 'بنر ألعاب حماسي',
  nameEn: 'Gaming Hype Banner',
  descAr: 'بنر 1024×500 أحمر داكن مع زر تشغيل ضخم ووهج خلفي',
  descEn: '1024×500 dark red banner with a huge play button and backdrop glow',
  isNew: true,
  exactSize: true,
  bg: '#09090B',
  bg2: '#1C1917',
  baseW: 1024,
  baseH: 500,
  objects: [
    { type: 'circle', x: 0.5, y: 0.55, size: 1, fill: '#EF4444', opacity: 0.14 },
    { type: 'rect', x: 0.2, y: 0.5, w: 0.004, h: 0.9, fill: '#FFFFFF', opacity: 0.05 },
    { type: 'rect', x: 0.5, y: 0.5, w: 0.004, h: 0.9, fill: '#FFFFFF', opacity: 0.05 },
    { type: 'rect', x: 0.8, y: 0.5, w: 0.004, h: 0.9, fill: '#FFFFFF', opacity: 0.05 },

    { type: 'rect', x: 0.5, y: 0.08, w: 0.16, h: 0.014, rx: 0.007, fill: '#EF4444' },

    { type: 'text', x: 0.5, y: 0.35, w: 0.9, text: 'ابدأ المغامرة\nالليلة', fontFamily: 'Cairo', size: 0.09, fill: '#FFFFFF', fontWeight: 900 },
    { type: 'text', x: 0.5, y: 0.56, w: 0.6, text: 'عوالم جديدة · تحديات أسبوعية', fontFamily: 'Tajawal', size: 0.034, fill: '#FCA5A5' },

    {
      type: 'rect', x: 0.5, y: 0.78, w: 0.28, h: 0.1, rx: 0.05,
      fill: '#EF4444', fill2: '#F97316',
      shadow: { color: 'rgba(239,68,68,0.45)', blur: 0.035 }
    },
    { type: 'text', x: 0.5, y: 0.78, text: 'حمّل مجانًا', fontFamily: 'Cairo', size: 0.034, fill: '#FFFFFF', fontWeight: 900 },

    { type: 'circle', x: 0.87, y: 0.5, size: 0.28, fill: '#EF4444', opacity: 0.25 },
    {
      type: 'circle', x: 0.87, y: 0.5, size: 0.2, fill: '#EF4444',
      shadow: { color: 'rgba(239,68,68,0.5)', blur: 0.05 }
    },
    { type: 'text', x: 0.87, y: 0.5, text: '▶', fontFamily: 'Cairo', size: 0.075, fill: '#FFFFFF', fontWeight: 900 }
  ]
};
