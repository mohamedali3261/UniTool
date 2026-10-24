import type { DesignTemplate } from './types';

export const gpTab10Feature: DesignTemplate = {
  id: 'gp-tab10-feature',
  cat: 'gp-tablet10',
  nameAr: 'تابلت 10 — مميزات',
  nameEn: '10" Tablet — Features',
  descAr: 'لقطة 1600×2560 لأيقونة كبيرة وأربع ميزات رئيسية',
  descEn: '1600×2560 screenshot with a large icon and four key features',
  isNew: true,
  exactSize: true,
  bg: '#1E1B4B',
  bg2: '#312E81',
  baseW: 1600,
  baseH: 2560,
  objects: [
    { type: 'circle', x: 0.5, y: 0.5, size: 1, fill: '#6366F1', opacity: 0.15 },
    { type: 'circle', x: 0.86, y: 0.16, size: 0.4, fill: '#22D3EE', opacity: 0.12 },

    { type: 'text', x: 0.5, y: 0.07, w: 0.9, text: 'كل ما تحتاجه\nفي تطبيق واحد', fontFamily: 'Cairo', size: 0.055, fill: '#FFFFFF', fontWeight: 900 },
    { type: 'text', x: 0.5, y: 0.13, w: 0.9, text: 'أدوات مصممة لسرعة إنجازك', fontFamily: 'Tajawal', size: 0.023, fill: '#C7D2FE' },

    {
      type: 'rect', x: 0.5, y: 0.33, w: 0.16, h: 0.16, rx: 0.04,
      fill: '#22D3EE', fill2: '#6366F1',
      shadow: { color: 'rgba(34,211,238,0.35)', blur: 0.04 }
    },
    { type: 'text', x: 0.5, y: 0.33, text: '★', fontFamily: 'Cairo', size: 0.08, fill: '#FFFFFF', fontWeight: 900 },

    { type: 'rect', x: 0.18, y: 0.68, w: 0.19, h: 0.26, rx: 0.03, fill: '#0F172A', opacity: 0.92 },
    { type: 'rect', x: 0.39, y: 0.68, w: 0.19, h: 0.26, rx: 0.03, fill: '#0F172A', opacity: 0.92 },
    { type: 'rect', x: 0.61, y: 0.68, w: 0.19, h: 0.26, rx: 0.03, fill: '#0F172A', opacity: 0.92 },
    { type: 'rect', x: 0.82, y: 0.68, w: 0.19, h: 0.26, rx: 0.03, fill: '#0F172A', opacity: 0.92 },
    { type: 'circle', x: 0.18, y: 0.59, size: 0.06, fill: '#22D3EE' },
    { type: 'circle', x: 0.39, y: 0.59, size: 0.06, fill: '#818CF8' },
    { type: 'circle', x: 0.61, y: 0.59, size: 0.06, fill: '#F472B6' },
    { type: 'circle', x: 0.82, y: 0.59, size: 0.06, fill: '#34D399' },
    { type: 'text', x: 0.18, y: 0.66, text: 'سريع', fontFamily: 'Cairo', size: 0.02, fill: '#FFFFFF', fontWeight: 800 },
    { type: 'text', x: 0.39, y: 0.66, text: 'آمن', fontFamily: 'Cairo', size: 0.02, fill: '#FFFFFF', fontWeight: 800 },
    { type: 'text', x: 0.61, y: 0.66, text: 'بسيط', fontFamily: 'Cairo', size: 0.02, fill: '#FFFFFF', fontWeight: 800 },
    { type: 'text', x: 0.82, y: 0.66, text: 'ذكي', fontFamily: 'Cairo', size: 0.02, fill: '#FFFFFF', fontWeight: 800 },
    { type: 'text', x: 0.18, y: 0.7, text: 'أداء فوري', fontFamily: 'Tajawal', size: 0.014, fill: '#94A3B8' },
    { type: 'text', x: 0.39, y: 0.7, text: 'تشفير كامل', fontFamily: 'Tajawal', size: 0.014, fill: '#94A3B8' },
    { type: 'text', x: 0.61, y: 0.7, text: 'بدون تعقيد', fontFamily: 'Tajawal', size: 0.014, fill: '#94A3B8' },
    { type: 'text', x: 0.82, y: 0.7, text: 'اقتراحات ذكية', fontFamily: 'Tajawal', size: 0.014, fill: '#94A3B8' },

    { type: 'rect', x: 0.5, y: 0.88, w: 0.24, h: 0.055, rx: 0.0275, fill: '#FFFFFF' },
    { type: 'text', x: 0.5, y: 0.88, text: 'جرّب الآن', fontFamily: 'Cairo', size: 0.018, fill: '#312E81', fontWeight: 900 }
  ]
};
