import type { DesignTemplate } from './types';

export const gpFeatureCleanLight: DesignTemplate = {
  id: 'gp-feature-clean-light',
  cat: 'gp-feature',
  nameAr: 'بنر نظيف فاتح',
  nameEn: 'Clean Light Banner',
  descAr: 'بنر 1024×500 بخلفية فاتحة وتايبوغرافي أسود وزر واضح',
  descEn: '1024×500 light banner with black typography and a clear CTA',
  isNew: true,
  exactSize: true,
  bg: '#F8FAFC',
  bg2: '#E2E8F0',
  baseW: 1024,
  baseH: 500,
  objects: [
    { type: 'rect', x: 0.06, y: 0.5, w: 0.014, h: 0.72, rx: 0.007, fill: '#0EA5E9' },
    { type: 'rect', x: 0.94, y: 0.5, w: 0.014, h: 0.4, rx: 0.007, fill: '#6366F1', opacity: 0.5 },

    { type: 'text', x: 0.5, y: 0.34, w: 0.8, text: 'أنجز أكثر\nبوقت أقل', fontFamily: 'Cairo', size: 0.08, fill: '#0F172A', fontWeight: 900 },
    { type: 'text', x: 0.5, y: 0.55, w: 0.7, text: 'تنظيم ذكي لمهامك اليومية — بدون تشتت', fontFamily: 'Tajawal', size: 0.032, fill: '#64748B' },

    {
      type: 'rect', x: 0.5, y: 0.75, w: 0.24, h: 0.1, rx: 0.05, fill: '#0F172A',
      shadow: { color: 'rgba(15,23,42,0.25)', blur: 0.03, offsetY: 0.012 }
    },
    { type: 'text', x: 0.5, y: 0.75, text: 'جرّب مجانًا', fontFamily: 'Cairo', size: 0.034, fill: '#FFFFFF', fontWeight: 800 },

    { type: 'circle', x: 0.83, y: 0.48, size: 0.1, fill: '#E0F2FE' },
    { type: 'circle', x: 0.83, y: 0.48, size: 0.035, fill: '#0EA5E9' },
    { type: 'text', x: 0.83, y: 0.64, text: '4.9', fontFamily: 'Cairo', size: 0.028, fill: '#475569', fontWeight: 900 },
    { type: 'text', x: 0.83, y: 0.69, text: 'تقييم المتجر', fontFamily: 'Tajawal', size: 0.017, fill: '#64748B' }
  ]
};
