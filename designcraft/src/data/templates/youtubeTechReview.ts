import type { DesignTemplate } from './types';

export const youtubeTechReview: DesignTemplate = {
  id: 'youtube-tech-review',
  cat: 'youtube',
  nameAr: 'مراجعة تقنية',
  nameEn: 'Tech Review Thumbnail',
  descAr: 'ثمبنيل تقني بخطوط دوائر سماوية وزر تشغيل أحمر ورقم إصدار',
  descEn: 'Tech thumbnail with cyan circuit lines, a red play badge and a year tag',
  isNew: true,
  bg: '#030712',
  bg2: '#0B1220',
  baseW: 1920,
  baseH: 1080,
  objects: [
    { type: 'circle', x: 0.84, y: 0.3, size: 0.55, fill: '#06B6D4', opacity: 0.09 },
    { type: 'circle', x: 0.15, y: 0.8, size: 0.45, fill: '#3B82F6', opacity: 0.08 },

    { type: 'rect', x: 0.25, y: 0.83, w: 0.42, h: 0.003, fill: '#22D3EE', opacity: 0.35 },
    { type: 'rect', x: 0.74, y: 0.16, w: 0.36, h: 0.003, fill: '#22D3EE', opacity: 0.25 },
    { type: 'rect', x: 0.08, y: 0.5, w: 0.003, h: 0.2, fill: '#22D3EE', opacity: 0.3 },
    { type: 'rect', x: 0.93, y: 0.62, w: 0.003, h: 0.24, fill: '#22D3EE', opacity: 0.3 },
    { type: 'circle', x: 0.25, y: 0.83, size: 0.014, fill: '#22D3EE' },
    { type: 'circle', x: 0.74, y: 0.16, size: 0.014, fill: '#22D3EE' },

    { type: 'rect', x: 0.2, y: 0.16, w: 0.2, h: 0.075, rx: 0.0375, fill: '#06B6D4' },
    { type: 'text', x: 0.2, y: 0.16, text: 'مراجعة 2026', fontFamily: 'Cairo', size: 0.03, fill: '#031018', fontWeight: 900 },

    { type: 'text', x: 0.38, y: 0.4, w: 0.6, text: 'أفضل لابتوب', fontFamily: 'Cairo', size: 0.088, fill: '#FFFFFF', fontWeight: 900 },
    { type: 'text', x: 0.38, y: 0.53, w: 0.6, text: 'للعمل والتصميم', fontFamily: 'Cairo', size: 0.058, fill: '#67E8F9', fontWeight: 700 },

    { type: 'text', x: 0.38, y: 0.68, w: 0.5, text: 'بعد تجربة 3 أشهر', fontFamily: 'Tajawal', size: 0.032, fill: '#94A3B8' },

    {
      type: 'circle', x: 0.815, y: 0.55, size: 0.19, fill: '#EF4444', fill2: '#B91C1C',
      shadow: { color: 'rgba(239,68,68,0.45)', blur: 0.04 }
    },
    { type: 'text', x: 0.815, y: 0.55, text: '▶', fontFamily: 'Montserrat', size: 0.06, fill: '#FFFFFF', fontWeight: 700 },

    { type: 'rect', x: 0.5, y: 0.94, w: 0.9, h: 0.004, fill: '#22D3EE', opacity: 0.2 },
    { type: 'text', x: 0.3, y: 0.955, text: 'الرابط في الوصف', fontFamily: 'Tajawal', size: 0.024, fill: '#64748B' }
  ]
};
