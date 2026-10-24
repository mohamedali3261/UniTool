import type { DesignTemplate } from './types';

export const gpTab7Dashboard: DesignTemplate = {
  id: 'gp-tab7-dashboard',
  cat: 'gp-tablet7',
  nameAr: 'تابلت 7 — لوحة تحكم',
  nameEn: '7" Tablet — Dashboard',
  descAr: 'لقطة 1200×1920 لوحة تحكم بجانبية تنقل وبطاقة إيرادات',
  descEn: '1200×1920 tablet dashboard with a nav sidebar and revenue card',
  isNew: true,
  exactSize: true,
  bg: '#0B1020',
  bg2: '#111C3A',
  baseW: 1200,
  baseH: 1920,
  objects: [
    { type: 'circle', x: 0.5, y: 0.1, size: 1, fill: '#6366F1', opacity: 0.15 },

    { type: 'text', x: 0.5, y: 0.07, w: 0.9, text: 'لوحة تحكم\nأذكى', fontFamily: 'Cairo', size: 0.062, fill: '#FFFFFF', fontWeight: 900 },
    { type: 'text', x: 0.5, y: 0.13, w: 0.9, text: 'قرارات أسرع من بيانات واضحة', fontFamily: 'Tajawal', size: 0.026, fill: '#93C5FD' },

    {
      type: 'rect', x: 0.5, y: 0.585, w: 0.94, h: 0.79, rx: 0.04, fill: '#0F172A',
      shadow: { color: 'rgba(2,6,23,0.5)', blur: 0.045, offsetY: 0.012 }
    },

    { type: 'rect', x: 0.22, y: 0.585, w: 0.26, h: 0.75, rx: 0.03, fill: '#0B1220' },
    { type: 'text', x: 0.22, y: 0.25, text: 'لوحة التحكم', fontFamily: 'Cairo', size: 0.024, fill: '#FFFFFF', fontWeight: 900 },

    { type: 'rect', x: 0.22, y: 0.35, w: 0.2, h: 0.045, rx: 0.022, fill: '#6366F1', fill2: '#22D3EE' },
    { type: 'rect', x: 0.22, y: 0.43, w: 0.2, h: 0.045, rx: 0.022, fill: '#1E293B' },
    { type: 'rect', x: 0.22, y: 0.51, w: 0.2, h: 0.045, rx: 0.022, fill: '#1E293B' },
    { type: 'rect', x: 0.22, y: 0.59, w: 0.2, h: 0.045, rx: 0.022, fill: '#1E293B' },
    { type: 'text', x: 0.22, y: 0.35, text: 'نظرة عامة', fontFamily: 'Tajawal', size: 0.017, fill: '#FFFFFF' },
    { type: 'text', x: 0.22, y: 0.43, text: 'الأداء', fontFamily: 'Tajawal', size: 0.017, fill: '#CBD5E1' },
    { type: 'text', x: 0.22, y: 0.51, text: 'التقارير', fontFamily: 'Tajawal', size: 0.017, fill: '#CBD5E1' },
    { type: 'text', x: 0.22, y: 0.59, text: 'الإعدادات', fontFamily: 'Tajawal', size: 0.017, fill: '#CBD5E1' },

    {
      type: 'rect', x: 0.68, y: 0.3, w: 0.42, h: 0.14, rx: 0.03,
      fill: '#6366F1', fill2: '#22D3EE',
      shadow: { color: 'rgba(99,102,241,0.35)', blur: 0.035 }
    },
    { type: 'text', x: 0.68, y: 0.275, text: 'الإيرادات', fontFamily: 'Tajawal', size: 0.02, fill: '#E0E7FF' },
    { type: 'text', x: 0.68, y: 0.32, text: '84,200 ج.م', fontFamily: 'Cairo', size: 0.04, fill: '#FFFFFF', fontWeight: 900 },

    { type: 'rect', x: 0.57, y: 0.49, w: 0.2, h: 0.12, rx: 0.025, fill: '#16213A' },
    { type: 'rect', x: 0.79, y: 0.49, w: 0.2, h: 0.12, rx: 0.025, fill: '#16213A' },
    { type: 'text', x: 0.57, y: 0.475, text: '2,480', fontFamily: 'Cairo', size: 0.03, fill: '#FFFFFF', fontWeight: 900 },
    { type: 'text', x: 0.57, y: 0.515, text: 'عملاء', fontFamily: 'Tajawal', size: 0.016, fill: '#94A3B8' },
    { type: 'text', x: 0.79, y: 0.475, text: '7.4%', fontFamily: 'Cairo', size: 0.03, fill: '#FFFFFF', fontWeight: 900 },
    { type: 'text', x: 0.79, y: 0.515, text: 'نمو', fontFamily: 'Tajawal', size: 0.016, fill: '#94A3B8' },

    { type: 'rect', x: 0.68, y: 0.64, w: 0.42, h: 0.22, rx: 0.025, fill: '#111C3A' },
    { type: 'text', x: 0.68, y: 0.665, text: 'نمو الأسبوع', fontFamily: 'Tajawal', size: 0.018, fill: '#CBD5E1', fontWeight: 700 },
    { type: 'rect', x: 0.55, y: 0.72, w: 0.035, h: 0.07, rx: 0.012, fill: '#22D3EE', opacity: 0.8 },
    { type: 'rect', x: 0.61, y: 0.71, w: 0.035, h: 0.09, rx: 0.012, fill: '#22D3EE', opacity: 0.8 },
    { type: 'rect', x: 0.67, y: 0.715, w: 0.035, h: 0.08, rx: 0.012, fill: '#22D3EE', opacity: 0.8 },
    { type: 'rect', x: 0.73, y: 0.7, w: 0.035, h: 0.11, rx: 0.012, fill: '#22D3EE', opacity: 0.8 },
    { type: 'rect', x: 0.79, y: 0.71, w: 0.035, h: 0.09, rx: 0.012, fill: '#22D3EE', opacity: 0.8 },
    { type: 'rect', x: 0.85, y: 0.69, w: 0.035, h: 0.13, rx: 0.012, fill: '#22D3EE' },
    { type: 'rect', x: 0.68, y: 0.78, w: 0.38, h: 0.003, fill: '#334155' },

    { type: 'rect', x: 0.68, y: 0.9, w: 0.24, h: 0.06, rx: 0.03, fill: '#22D3EE' },
    { type: 'text', x: 0.68, y: 0.9, text: 'تصدير التقرير', fontFamily: 'Tajawal', size: 0.018, fill: '#04121F', fontWeight: 900 }
  ]
};
