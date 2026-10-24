import type { DesignTemplate } from './types';

export const gpTab10Dashboard: DesignTemplate = {
  id: 'gp-tab10-dashboard',
  cat: 'gp-tablet10',
  nameAr: 'تابلت 10 — لوحة تحكم',
  nameEn: '10" Tablet — Dashboard',
  descAr: 'لقطة 1600×2560 لوحة تحكم واسعة بجانبية وأربع مؤشرات',
  descEn: '1600×2560 wide dashboard with a sidebar and four KPI cards',
  isNew: true,
  exactSize: true,
  bg: '#0B1020',
  bg2: '#111C3A',
  baseW: 1600,
  baseH: 2560,
  objects: [
    { type: 'circle', x: 0.5, y: 0.1, size: 1, fill: '#6366F1', opacity: 0.15 },

    { type: 'text', x: 0.5, y: 0.055, w: 0.9, text: 'لوحة تحكم\nمتكاملة', fontFamily: 'Cairo', size: 0.052, fill: '#FFFFFF', fontWeight: 900 },
    { type: 'text', x: 0.5, y: 0.11, w: 0.9, text: 'راقب أعمالك من شاشة واحدة', fontFamily: 'Tajawal', size: 0.023, fill: '#93C5FD' },

    {
      type: 'rect', x: 0.5, y: 0.57, w: 0.94, h: 0.82, rx: 0.03, fill: '#0F172A',
      shadow: { color: 'rgba(2,6,23,0.5)', blur: 0.04, offsetY: 0.01 }
    },

    { type: 'rect', x: 0.19, y: 0.57, w: 0.24, h: 0.78, rx: 0.025, fill: '#0B1220' },
    { type: 'text', x: 0.19, y: 0.21, text: 'لوحة التحكم', fontFamily: 'Cairo', size: 0.02, fill: '#FFFFFF', fontWeight: 900 },

    { type: 'rect', x: 0.19, y: 0.3, w: 0.18, h: 0.042, rx: 0.02, fill: '#6366F1', fill2: '#22D3EE' },
    { type: 'rect', x: 0.19, y: 0.38, w: 0.18, h: 0.042, rx: 0.02, fill: '#1E293B' },
    { type: 'rect', x: 0.19, y: 0.46, w: 0.18, h: 0.042, rx: 0.02, fill: '#1E293B' },
    { type: 'rect', x: 0.19, y: 0.54, w: 0.18, h: 0.042, rx: 0.02, fill: '#1E293B' },
    { type: 'text', x: 0.19, y: 0.3, text: 'نظرة عامة', fontFamily: 'Tajawal', size: 0.015, fill: '#FFFFFF' },
    { type: 'text', x: 0.19, y: 0.38, text: 'الأداء', fontFamily: 'Tajawal', size: 0.015, fill: '#CBD5E1' },
    { type: 'text', x: 0.19, y: 0.46, text: 'التقارير', fontFamily: 'Tajawal', size: 0.015, fill: '#CBD5E1' },
    { type: 'text', x: 0.19, y: 0.54, text: 'الإعدادات', fontFamily: 'Tajawal', size: 0.015, fill: '#CBD5E1' },

    {
      type: 'rect', x: 0.66, y: 0.25, w: 0.46, h: 0.13, rx: 0.025,
      fill: '#6366F1', fill2: '#22D3EE',
      shadow: { color: 'rgba(99,102,241,0.35)', blur: 0.03 }
    },
    { type: 'text', x: 0.66, y: 0.228, text: 'الإيرادات', fontFamily: 'Tajawal', size: 0.018, fill: '#E0E7FF' },
    { type: 'text', x: 0.66, y: 0.268, text: '84,200 ج.م', fontFamily: 'Cairo', size: 0.035, fill: '#FFFFFF', fontWeight: 900 },

    { type: 'rect', x: 0.43, y: 0.42, w: 0.14, h: 0.1, rx: 0.02, fill: '#16213A' },
    { type: 'rect', x: 0.59, y: 0.42, w: 0.14, h: 0.1, rx: 0.02, fill: '#16213A' },
    { type: 'rect', x: 0.75, y: 0.42, w: 0.14, h: 0.1, rx: 0.02, fill: '#16213A' },
    { type: 'rect', x: 0.91, y: 0.42, w: 0.14, h: 0.1, rx: 0.02, fill: '#16213A' },
    { type: 'text', x: 0.43, y: 0.405, text: '2,480', fontFamily: 'Cairo', size: 0.022, fill: '#FFFFFF', fontWeight: 900 },
    { type: 'text', x: 0.59, y: 0.405, text: '7.4%', fontFamily: 'Cairo', size: 0.022, fill: '#FFFFFF', fontWeight: 900 },
    { type: 'text', x: 0.75, y: 0.405, text: '18', fontFamily: 'Cairo', size: 0.022, fill: '#FFFFFF', fontWeight: 900 },
    { type: 'text', x: 0.91, y: 0.405, text: '96%', fontFamily: 'Cairo', size: 0.022, fill: '#FFFFFF', fontWeight: 900 },
    { type: 'text', x: 0.43, y: 0.44, text: 'عملاء', fontFamily: 'Tajawal', size: 0.013, fill: '#94A3B8' },
    { type: 'text', x: 0.59, y: 0.44, text: 'نمو', fontFamily: 'Tajawal', size: 0.013, fill: '#94A3B8' },
    { type: 'text', x: 0.75, y: 0.44, text: 'طلبات', fontFamily: 'Tajawal', size: 0.013, fill: '#94A3B8' },
    { type: 'text', x: 0.91, y: 0.44, text: 'رضا', fontFamily: 'Tajawal', size: 0.013, fill: '#94A3B8' },

    { type: 'rect', x: 0.66, y: 0.58, w: 0.46, h: 0.3, rx: 0.025, fill: '#111C3A' },
    { type: 'text', x: 0.66, y: 0.605, text: 'الأداء الأسبوعي', fontFamily: 'Tajawal', size: 0.018, fill: '#CBD5E1', fontWeight: 700 },
    { type: 'rect', x: 0.48, y: 0.73, w: 0.035, h: 0.08, rx: 0.012, fill: '#22D3EE', opacity: 0.8 },
    { type: 'rect', x: 0.54, y: 0.72, w: 0.035, h: 0.1, rx: 0.012, fill: '#22D3EE', opacity: 0.8 },
    { type: 'rect', x: 0.6, y: 0.725, w: 0.035, h: 0.09, rx: 0.012, fill: '#22D3EE', opacity: 0.8 },
    { type: 'rect', x: 0.66, y: 0.71, w: 0.035, h: 0.12, rx: 0.012, fill: '#22D3EE', opacity: 0.8 },
    { type: 'rect', x: 0.72, y: 0.72, w: 0.035, h: 0.1, rx: 0.012, fill: '#22D3EE', opacity: 0.8 },
    { type: 'rect', x: 0.78, y: 0.705, w: 0.035, h: 0.13, rx: 0.012, fill: '#22D3EE' },
    { type: 'rect', x: 0.84, y: 0.715, w: 0.035, h: 0.11, rx: 0.012, fill: '#22D3EE', opacity: 0.8 },
    { type: 'rect', x: 0.9, y: 0.7, w: 0.035, h: 0.14, rx: 0.012, fill: '#22D3EE' },
    { type: 'rect', x: 0.66, y: 0.78, w: 0.4, h: 0.003, fill: '#334155' },

    { type: 'rect', x: 0.66, y: 0.92, w: 0.2, h: 0.05, rx: 0.025, fill: '#22D3EE' },
    { type: 'text', x: 0.66, y: 0.92, text: 'تصدير', fontFamily: 'Tajawal', size: 0.015, fill: '#04121F', fontWeight: 900 }
  ]
};
