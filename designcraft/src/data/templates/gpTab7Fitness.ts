import type { DesignTemplate } from './types';

export const gpTab7Fitness: DesignTemplate = {
  id: 'gp-tab7-fitness',
  cat: 'gp-tablet7',
  nameAr: 'تابلت 7 — لياقة',
  nameEn: '7" Tablet — Fitness',
  descAr: 'لقطة 1200×1920 للياقة بحلقة هدف ومخطط نبض',
  descEn: '1200×1920 fitness dashboard with a goal ring and pulse chart',
  isNew: true,
  exactSize: true,
  bg: '#04150D',
  bg2: '#0B3B24',
  baseW: 1200,
  baseH: 1920,
  objects: [
    { type: 'circle', x: 0.5, y: 0.1, size: 1, fill: '#34D399', opacity: 0.12 },

    { type: 'text', x: 0.5, y: 0.07, w: 0.9, text: 'لياقتك\nبرؤية أوضح', fontFamily: 'Cairo', size: 0.06, fill: '#FFFFFF', fontWeight: 900 },
    { type: 'text', x: 0.5, y: 0.135, w: 0.9, text: 'بيانات دقيقة لكل تمرين', fontFamily: 'Tajawal', size: 0.026, fill: '#A7F3D0' },

    {
      type: 'rect', x: 0.5, y: 0.585, w: 0.94, h: 0.79, rx: 0.04, fill: '#08120C',
      shadow: { color: 'rgba(0,0,0,0.5)', blur: 0.045, offsetY: 0.012 }
    },

    { type: 'circle', x: 0.27, y: 0.38, size: 0.28, fill: '#0F172A' },
    { type: 'circle', x: 0.27, y: 0.38, size: 0.21, fill: '#064E3B' },
    { type: 'text', x: 0.27, y: 0.375, text: '82%', fontFamily: 'Cairo', size: 0.04, fill: '#FFFFFF', fontWeight: 900 },
    { type: 'text', x: 0.27, y: 0.415, text: 'الهدف', fontFamily: 'Tajawal', size: 0.016, fill: '#86EFAC' },

    { type: 'rect', x: 0.65, y: 0.28, w: 0.36, h: 0.1, rx: 0.025, fill: '#0F172A' },
    { type: 'rect', x: 0.65, y: 0.41, w: 0.36, h: 0.1, rx: 0.025, fill: '#0F172A' },
    { type: 'text', x: 0.65, y: 0.265, text: '12.4 كم', fontFamily: 'Cairo', size: 0.025, fill: '#FFFFFF', fontWeight: 800 },
    { type: 'text', x: 0.65, y: 0.3, text: 'المسافة', fontFamily: 'Tajawal', size: 0.014, fill: '#94A3B8' },
    { type: 'text', x: 0.65, y: 0.395, text: '6,200', fontFamily: 'Cairo', size: 0.025, fill: '#FFFFFF', fontWeight: 800 },
    { type: 'text', x: 0.65, y: 0.43, text: 'السعرات', fontFamily: 'Tajawal', size: 0.014, fill: '#94A3B8' },

    { type: 'text', x: 0.27, y: 0.57, text: 'نبض القلب', fontFamily: 'Cairo', size: 0.022, fill: '#FFFFFF', fontWeight: 800 },
    { type: 'rect', x: 0.5, y: 0.72, w: 0.8, h: 0.2, rx: 0.025, fill: '#0F172A' },
    { type: 'rect', x: 0.2, y: 0.75, w: 0.05, h: 0.06, rx: 0.015, fill: '#34D399', opacity: 0.8 },
    { type: 'rect', x: 0.3, y: 0.735, w: 0.05, h: 0.09, rx: 0.015, fill: '#34D399', opacity: 0.8 },
    { type: 'rect', x: 0.4, y: 0.745, w: 0.05, h: 0.07, rx: 0.015, fill: '#34D399', opacity: 0.8 },
    { type: 'rect', x: 0.5, y: 0.725, w: 0.05, h: 0.11, rx: 0.015, fill: '#34D399' },
    { type: 'rect', x: 0.6, y: 0.74, w: 0.05, h: 0.08, rx: 0.015, fill: '#34D399', opacity: 0.8 },
    { type: 'rect', x: 0.7, y: 0.715, w: 0.05, h: 0.13, rx: 0.015, fill: '#34D399' },
    { type: 'rect', x: 0.8, y: 0.73, w: 0.05, h: 0.1, rx: 0.015, fill: '#34D399', opacity: 0.8 },
    { type: 'rect', x: 0.5, y: 0.79, w: 0.7, h: 0.003, fill: '#334155' },

    { type: 'rect', x: 0.5, y: 0.9, w: 0.3, h: 0.06, rx: 0.03, fill: '#34D399' },
    { type: 'text', x: 0.5, y: 0.9, text: 'ابدأ تمرينًا', fontFamily: 'Tajawal', size: 0.018, fill: '#04150D', fontWeight: 900 }
  ]
};
