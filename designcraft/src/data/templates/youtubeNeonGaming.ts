import type { DesignTemplate } from './types';

export const youtubeNeonGaming: DesignTemplate = {
  id: 'youtube-neon-gaming',
  cat: 'youtube',
  nameAr: 'ثمبنيل جيمنج نيون',
  nameEn: 'Neon Gaming Thumbnail',
  descAr: 'شرائح نيون مائلة وعنوان ضخم بلمعة سماوي-بنفسجي',
  descEn: 'Angled neon slabs with a huge cyan-to-violet glowing title',
  isNew: true,
  bg: '#05010F',
  bg2: '#1E1B4B',
  baseW: 1920,
  baseH: 1080,
  objects: [
    { type: 'rect', x: 0.5, y: 0.52, w: 1.5, h: 0.5, fill: '#22D3EE', fill2: '#D946EF', opacity: 0.1, rotation: -12 },
    { type: 'rect', x: 0.5, y: 0.6, w: 1.4, h: 0.28, fill: '#8B5CF6', opacity: 0.1, rotation: 8 },
    { type: 'circle', x: 0.8, y: 0.28, size: 0.5, fill: '#D946EF', opacity: 0.16 },
    { type: 'circle', x: 0.2, y: 0.8, size: 0.42, fill: '#22D3EE', opacity: 0.12 },

    { type: 'rect', x: 0.2, y: 0.7, w: 0.014, h: 0.014, fill: '#22D3EE', rotation: 45, shadow: { color: 'rgba(34,211,238,0.7)', blur: 0.02 } },
    { type: 'rect', x: 0.86, y: 0.55, w: 0.012, h: 0.012, fill: '#F0ABFC', rotation: 45 },
    { type: 'rect', x: 0.72, y: 0.86, w: 0.009, h: 0.009, fill: '#FFFFFF', rotation: 45, opacity: 0.85 },

    {
      type: 'rect', x: 0.15, y: 0.14, w: 0.15, h: 0.075, rx: 0.0375,
      fill: '#22D3EE', fill2: '#6366F1',
      shadow: { color: 'rgba(34,211,238,0.5)', blur: 0.04 }
    },
    { type: 'text', x: 0.15, y: 0.14, w: 0.12, text: 'حصري', fontFamily: 'Cairo', size: 0.032, fill: '#05010F', fontWeight: 900 },

    { type: 'rect', x: 0.5, y: 0.275, w: 0.1, h: 0.008, fill: '#F0ABFC' },
    {
      type: 'text', x: 0.5, y: 0.43, w: 0.75, text: 'أسرار\nالاحتراف', fontFamily: 'Cairo', size: 0.105,
      fill: '#FFFFFF', fontWeight: 900,
      shadow: { color: 'rgba(34,211,238,0.35)', blur: 0.02 }
    },
    { type: 'text', x: 0.5, y: 0.63, text: 'دليل كامل من الصفر للاحتراف', fontFamily: 'Tajawal', size: 0.036, fill: '#A5F3FC', fontWeight: 700 },

    { type: 'rect', x: 0.5, y: 0.82, w: 0.24, h: 0.075, rx: 0.0375, fill: '#FFFFFF' },
    { type: 'text', x: 0.5, y: 0.82, text: 'شاهد الآن', fontFamily: 'Cairo', size: 0.033, fill: '#0F172A', fontWeight: 900 }
  ]
};
