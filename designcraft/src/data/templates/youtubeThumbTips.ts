import type { DesignTemplate } from './types';

export const youtubeThumbTips: DesignTemplate = {
  id: 'youtube-tips',
  cat: 'youtube',
  nameAr: 'ثمبنيل يوتيوب جريء',
  nameEn: 'Bold YouTube Thumbnail',
  descAr: 'عنوان ثقيل مع شريط أحمر جانبي وتوهج خلفي',
  descEn: 'Heavy title with a red side bar and a warm backdrop glow',
  bg: '#09090B',
  bg2: '#111827',
  baseW: 1920,
  baseH: 1080,
  objects: [
    { type: 'circle', x: 0.78, y: 0.45, size: 0.55, fill: '#EF4444', opacity: 0.13 },

    { type: 'rect', x: 0.085, y: 0.5, w: 0.032, h: 0.42, fill: '#EF4444', fill2: '#F97316' },
    { type: 'rect', x: 0.915, y: 0.5, w: 0.01, h: 0.2, fill: '#F59E0B', opacity: 0.6 },

    {
      type: 'rect', x: 0.5, y: 0.145, w: 0.14, h: 0.07, rx: 0.035, fill: '#EF4444',
      shadow: { color: 'rgba(239,68,68,0.45)', blur: 0.03 }
    },
    { type: 'text', x: 0.5, y: 0.145, text: 'جديد', fontFamily: 'Cairo', size: 0.032, fill: '#FFFFFF', fontWeight: 900 },

    { type: 'text', x: 0.5, y: 0.4, w: 0.7, text: 'أفضل 5 نصائح', fontFamily: 'Cairo', size: 0.085, fill: '#FFFFFF', fontWeight: 900 },
    { type: 'text', x: 0.5, y: 0.56, w: 0.6, text: 'لنمو قناتك بسرعة', fontFamily: 'Cairo', size: 0.055, fill: '#93C5FD', fontWeight: 700 },
    { type: 'rect', x: 0.5, y: 0.635, w: 0.14, h: 0.01, fill: '#EF4444' },

    { type: 'rect', x: 0.5, y: 0.82, w: 0.32, h: 0.085, rx: 0.0425, fill: '#FFFFFF' },
    { type: 'text', x: 0.5, y: 0.82, text: 'اشترك الآن', fontFamily: 'Cairo', size: 0.038, fill: '#09090B', fontWeight: 900 },

    { type: 'rect', x: 0.5, y: 0.965, w: 0.86, h: 0.004, fill: '#FFFFFF', opacity: 0.12 }
  ]
};
