import type { DesignTemplate } from './types';

export const gpPhoneFitness: DesignTemplate = {
  id: 'gp-phone-fitness',
  cat: 'gp-phone',
  nameAr: 'لقطة هاتف — لياقة',
  nameEn: 'Phone Shot — Fitness',
  descAr: 'لقطة 1080×1920 لتطبيق لياقة بحلقة خطوات ورسم أسبوعي',
  descEn: '1080×1920 fitness screenshot with a step ring and weekly chart',
  isNew: true,
  exactSize: true,
  bg: '#04150D',
  bg2: '#0B3B24',
  baseW: 1080,
  baseH: 1920,
  objects: [
    { type: 'circle', x: 0.5, y: 0.1, size: 1.1, fill: '#34D399', opacity: 0.12 },

    { type: 'text', x: 0.5, y: 0.075, w: 0.9, text: 'كل خطوة\nتقرّبك', fontFamily: 'Cairo', size: 0.075, fill: '#FFFFFF', fontWeight: 900 },
    { type: 'text', x: 0.5, y: 0.14, w: 0.9, text: 'تتبّع نشاطك ونومك بدقة', fontFamily: 'Tajawal', size: 0.03, fill: '#A7F3D0' },

    {
      type: 'rect', x: 0.5, y: 0.575, w: 0.9, h: 0.78, rx: 0.045, fill: '#08120C',
      shadow: { color: 'rgba(0,0,0,0.5)', blur: 0.05, offsetY: 0.012 }
    },

    { type: 'circle', x: 0.5, y: 0.34, size: 0.36, fill: '#0F172A' },
    { type: 'circle', x: 0.5, y: 0.34, size: 0.28, fill: '#064E3B' },
    { type: 'text', x: 0.5, y: 0.325, text: '8,420', fontFamily: 'Cairo', size: 0.05, fill: '#FFFFFF', fontWeight: 900 },
    { type: 'text', x: 0.5, y: 0.37, text: 'خطوة اليوم', fontFamily: 'Tajawal', size: 0.02, fill: '#86EFAC' },

    { type: 'rect', x: 0.29, y: 0.53, w: 0.34, h: 0.11, rx: 0.025, fill: '#0F172A' },
    { type: 'rect', x: 0.71, y: 0.53, w: 0.34, h: 0.11, rx: 0.025, fill: '#0F172A' },
    { type: 'text', x: 0.29, y: 0.515, text: '12.4 كم', fontFamily: 'Cairo', size: 0.03, fill: '#FFFFFF', fontWeight: 800 },
    { type: 'text', x: 0.29, y: 0.55, text: 'المسافة', fontFamily: 'Tajawal', size: 0.018, fill: '#94A3B8' },
    { type: 'text', x: 0.71, y: 0.515, text: '6,200', fontFamily: 'Cairo', size: 0.03, fill: '#FFFFFF', fontWeight: 800 },
    { type: 'text', x: 0.71, y: 0.55, text: 'السعرات', fontFamily: 'Tajawal', size: 0.018, fill: '#94A3B8' },

    { type: 'text', x: 0.5, y: 0.635, text: 'نشاط الأسبوع', fontFamily: 'Cairo', size: 0.028, fill: '#FFFFFF', fontWeight: 800 },

    { type: 'rect', x: 0.24, y: 0.74, w: 0.05, h: 0.08, rx: 0.02, fill: '#34D399', opacity: 0.85 },
    { type: 'rect', x: 0.34, y: 0.725, w: 0.05, h: 0.11, rx: 0.02, fill: '#34D399', opacity: 0.85 },
    { type: 'rect', x: 0.44, y: 0.75, w: 0.05, h: 0.06, rx: 0.02, fill: '#34D399', opacity: 0.85 },
    { type: 'rect', x: 0.54, y: 0.715, w: 0.05, h: 0.13, rx: 0.02, fill: '#34D399' },
    { type: 'rect', x: 0.64, y: 0.735, w: 0.05, h: 0.09, rx: 0.02, fill: '#34D399', opacity: 0.85 },
    { type: 'rect', x: 0.74, y: 0.755, w: 0.05, h: 0.05, rx: 0.02, fill: '#34D399', opacity: 0.85 },
    { type: 'rect', x: 0.5, y: 0.78, w: 0.62, h: 0.004, fill: '#1E293B' },

    { type: 'text', x: 0.5, y: 0.845, text: 'هدفك اليومي', fontFamily: 'Cairo', size: 0.026, fill: '#FFFFFF', fontWeight: 800 },
    { type: 'rect', x: 0.5, y: 0.89, w: 0.72, h: 0.028, rx: 0.014, fill: '#1E293B' },
    { type: 'rect', x: 0.36, y: 0.89, w: 0.42, h: 0.028, rx: 0.014, fill: '#34D399' },
    { type: 'text', x: 0.5, y: 0.925, text: '68%', fontFamily: 'Cairo', size: 0.018, fill: '#86EFAC', fontWeight: 700 }
  ]
};
