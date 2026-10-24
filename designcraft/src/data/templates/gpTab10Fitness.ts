import type { DesignTemplate } from './types';

export const gpTab10Fitness: DesignTemplate = {
  id: 'gp-tab10-fitness',
  cat: 'gp-tablet10',
  nameAr: 'تابلت 10 — لياقة',
  nameEn: '10" Tablet — Fitness',
  descAr: 'لقطة 1600×2560 للياقة بحلقة هدف وبطاقات ورسوم دقيقة',
  descEn: '1600×2560 fitness screenshot with a goal ring, stat cards and charts',
  isNew: true,
  exactSize: true,
  bg: '#04150D',
  bg2: '#0B3B24',
  baseW: 1600,
  baseH: 2560,
  objects: [
    { type: 'circle', x: 0.5, y: 0.1, size: 1, fill: '#34D399', opacity: 0.12 },

    { type: 'text', x: 0.5, y: 0.055, w: 0.9, text: 'لياقة\nأذكى', fontFamily: 'Cairo', size: 0.055, fill: '#FFFFFF', fontWeight: 900 },
    { type: 'text', x: 0.5, y: 0.115, w: 0.9, text: 'تحليلات دقيقة لكل تمرين', fontFamily: 'Tajawal', size: 0.023, fill: '#A7F3D0' },

    {
      type: 'rect', x: 0.5, y: 0.57, w: 0.94, h: 0.82, rx: 0.03, fill: '#08120C',
      shadow: { color: 'rgba(0,0,0,0.5)', blur: 0.04, offsetY: 0.01 }
    },

    { type: 'circle', x: 0.27, y: 0.33, size: 0.26, fill: '#0F172A' },
    { type: 'circle', x: 0.27, y: 0.33, size: 0.2, fill: '#064E3B' },
    { type: 'text', x: 0.27, y: 0.325, text: '82%', fontFamily: 'Cairo', size: 0.035, fill: '#FFFFFF', fontWeight: 900 },
    { type: 'text', x: 0.27, y: 0.365, text: 'الهدف اليومي', fontFamily: 'Tajawal', size: 0.014, fill: '#86EFAC' },

    { type: 'rect', x: 0.66, y: 0.24, w: 0.42, h: 0.09, rx: 0.02, fill: '#0F172A' },
    { type: 'rect', x: 0.66, y: 0.36, w: 0.42, h: 0.09, rx: 0.02, fill: '#0F172A' },
    { type: 'rect', x: 0.66, y: 0.48, w: 0.42, h: 0.09, rx: 0.02, fill: '#0F172A' },
    { type: 'text', x: 0.66, y: 0.225, text: '12.4 كم', fontFamily: 'Cairo', size: 0.022, fill: '#FFFFFF', fontWeight: 800 },
    { type: 'text', x: 0.66, y: 0.26, text: 'المسافة', fontFamily: 'Tajawal', size: 0.013, fill: '#94A3B8' },
    { type: 'text', x: 0.66, y: 0.345, text: '6,200', fontFamily: 'Cairo', size: 0.022, fill: '#FFFFFF', fontWeight: 800 },
    { type: 'text', x: 0.66, y: 0.38, text: 'السعرات', fontFamily: 'Tajawal', size: 0.013, fill: '#94A3B8' },
    { type: 'text', x: 0.66, y: 0.465, text: '7.5 ساعات', fontFamily: 'Cairo', size: 0.022, fill: '#FFFFFF', fontWeight: 800 },
    { type: 'text', x: 0.66, y: 0.5, text: 'النوم', fontFamily: 'Tajawal', size: 0.013, fill: '#94A3B8' },

    { type: 'text', x: 0.27, y: 0.53, text: 'معدل النبض', fontFamily: 'Cairo', size: 0.02, fill: '#FFFFFF', fontWeight: 800 },

    { type: 'rect', x: 0.5, y: 0.7, w: 0.84, h: 0.22, rx: 0.02, fill: '#0F172A' },
    { type: 'rect', x: 0.18, y: 0.74, w: 0.04, h: 0.06, rx: 0.012, fill: '#34D399', opacity: 0.8 },
    { type: 'rect', x: 0.26, y: 0.73, w: 0.04, h: 0.09, rx: 0.012, fill: '#34D399', opacity: 0.8 },
    { type: 'rect', x: 0.34, y: 0.735, w: 0.04, h: 0.08, rx: 0.012, fill: '#34D399', opacity: 0.8 },
    { type: 'rect', x: 0.42, y: 0.72, w: 0.04, h: 0.11, rx: 0.012, fill: '#34D399', opacity: 0.8 },
    { type: 'rect', x: 0.5, y: 0.73, w: 0.04, h: 0.09, rx: 0.012, fill: '#34D399', opacity: 0.8 },
    { type: 'rect', x: 0.58, y: 0.715, w: 0.04, h: 0.12, rx: 0.012, fill: '#34D399' },
    { type: 'rect', x: 0.66, y: 0.725, w: 0.04, h: 0.1, rx: 0.012, fill: '#34D399', opacity: 0.8 },
    { type: 'rect', x: 0.74, y: 0.71, w: 0.04, h: 0.13, rx: 0.012, fill: '#34D399' },
    { type: 'rect', x: 0.82, y: 0.725, w: 0.04, h: 0.1, rx: 0.012, fill: '#34D399', opacity: 0.8 },
    { type: 'rect', x: 0.9, y: 0.735, w: 0.04, h: 0.08, rx: 0.012, fill: '#34D399', opacity: 0.8 },
    { type: 'rect', x: 0.5, y: 0.79, w: 0.8, h: 0.0025, fill: '#334155' },

    { type: 'rect', x: 0.5, y: 0.92, w: 0.24, h: 0.055, rx: 0.0275, fill: '#34D399' },
    { type: 'text', x: 0.5, y: 0.92, text: 'ابدأ الآن', fontFamily: 'Tajawal', size: 0.016, fill: '#04150D', fontWeight: 900 }
  ]
};
