import type { DesignTemplate } from './types';

export const gpTab7Feature: DesignTemplate = {
  id: 'gp-tab7-feature',
  cat: 'gp-tablet7',
  nameAr: 'تابلت 7 — مميزات',
  nameEn: '7" Tablet — Features',
  descAr: 'لقطة 1200×1920 تعرض أيقونة كبيرة وثلاث ميزات',
  descEn: '1200×1920 screenshot with a big icon and three feature cards',
  isNew: true,
  exactSize: true,
  bg: '#1E1B4B',
  bg2: '#312E81',
  baseW: 1200,
  baseH: 1920,
  objects: [
    { type: 'circle', x: 0.5, y: 0.5, size: 1, fill: '#6366F1', opacity: 0.15 },
    { type: 'circle', x: 0.86, y: 0.16, size: 0.4, fill: '#22D3EE', opacity: 0.12 },

    { type: 'text', x: 0.5, y: 0.09, w: 0.9, text: 'كل ما تحتاجه\nفي تطبيق', fontFamily: 'Cairo', size: 0.06, fill: '#FFFFFF', fontWeight: 900 },
    { type: 'text', x: 0.5, y: 0.15, w: 0.9, text: 'أدوات مصممة لسرعة إنجازك', fontFamily: 'Tajawal', size: 0.026, fill: '#C7D2FE' },

    {
      type: 'rect', x: 0.5, y: 0.38, w: 0.2, h: 0.2, rx: 0.05,
      fill: '#22D3EE', fill2: '#6366F1',
      shadow: { color: 'rgba(34,211,238,0.35)', blur: 0.045 }
    },
    { type: 'text', x: 0.5, y: 0.38, text: '★', fontFamily: 'Cairo', size: 0.1, fill: '#FFFFFF', fontWeight: 900 },

    { type: 'rect', x: 0.2, y: 0.66, w: 0.26, h: 0.22, rx: 0.035, fill: '#0F172A', opacity: 0.9 },
    { type: 'rect', x: 0.5, y: 0.66, w: 0.26, h: 0.22, rx: 0.035, fill: '#0F172A', opacity: 0.9 },
    { type: 'rect', x: 0.8, y: 0.66, w: 0.26, h: 0.22, rx: 0.035, fill: '#0F172A', opacity: 0.9 },
    { type: 'circle', x: 0.2, y: 0.6, size: 0.07, fill: '#22D3EE' },
    { type: 'circle', x: 0.5, y: 0.6, size: 0.07, fill: '#818CF8' },
    { type: 'circle', x: 0.8, y: 0.6, size: 0.07, fill: '#F472B6' },
    { type: 'text', x: 0.2, y: 0.66, text: 'سريع', fontFamily: 'Cairo', size: 0.022, fill: '#FFFFFF', fontWeight: 800 },
    { type: 'text', x: 0.5, y: 0.66, text: 'آمن', fontFamily: 'Cairo', size: 0.022, fill: '#FFFFFF', fontWeight: 800 },
    { type: 'text', x: 0.8, y: 0.66, text: 'بسيط', fontFamily: 'Cairo', size: 0.022, fill: '#FFFFFF', fontWeight: 800 },
    { type: 'text', x: 0.2, y: 0.705, text: 'أداء فوري', fontFamily: 'Tajawal', size: 0.016, fill: '#94A3B8' },
    { type: 'text', x: 0.5, y: 0.705, text: 'تشفير كامل', fontFamily: 'Tajawal', size: 0.016, fill: '#94A3B8' },
    { type: 'text', x: 0.8, y: 0.705, text: 'بدون تعقيد', fontFamily: 'Tajawal', size: 0.016, fill: '#94A3B8' },

    { type: 'rect', x: 0.5, y: 0.88, w: 0.3, h: 0.065, rx: 0.0325, fill: '#FFFFFF' },
    { type: 'text', x: 0.5, y: 0.88, text: 'جرّب الآن', fontFamily: 'Cairo', size: 0.022, fill: '#312E81', fontWeight: 900 }
  ]
};
