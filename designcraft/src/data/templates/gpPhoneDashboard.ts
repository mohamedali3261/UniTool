import type { DesignTemplate } from './types';

export const gpPhoneDashboard: DesignTemplate = {
  id: 'gp-phone-dashboard',
  cat: 'gp-phone',
  nameAr: 'لقطة هاتف — محفظة',
  nameEn: 'Phone Shot — Wallet',
  descAr: 'لقطة 1080×1920 لواجهة محفظة رقمية بعنوان تسويقي',
  descEn: '1080×1920 screenshot for a digital wallet UI with a marketing headline',
  isNew: true,
  exactSize: true,
  bg: '#0B1020',
  bg2: '#111C3A',
  baseW: 1080,
  baseH: 1920,
  objects: [
    { type: 'circle', x: 0.5, y: 0.12, size: 1.1, fill: '#6366F1', opacity: 0.16 },
    { type: 'circle', x: 0.9, y: 0.04, size: 0.4, fill: '#22D3EE', opacity: 0.12 },

    { type: 'text', x: 0.5, y: 0.075, w: 0.9, text: 'تحكّم كامل\nفي أموالك', fontFamily: 'Cairo', size: 0.075, fill: '#FFFFFF', fontWeight: 900 },
    { type: 'text', x: 0.5, y: 0.14, w: 0.9, text: 'كل حساباتك وبطاقاتك في مكان واحد', fontFamily: 'Tajawal', size: 0.03, fill: '#93C5FD' },

    {
      type: 'rect', x: 0.5, y: 0.575, w: 0.9, h: 0.78, rx: 0.045, fill: '#0F172A',
      shadow: { color: 'rgba(2,6,23,0.55)', blur: 0.05, offsetY: 0.012 }
    },
    { type: 'rect', x: 0.5, y: 0.2, w: 0.2, h: 0.012, rx: 0.006, fill: '#1E293B' },

    { type: 'text', x: 0.5, y: 0.25, text: 'المحفظة', fontFamily: 'Cairo', size: 0.038, fill: '#FFFFFF', fontWeight: 800 },
    { type: 'text', x: 0.5, y: 0.282, text: 'أهلاً، أحمد', fontFamily: 'Tajawal', size: 0.022, fill: '#64748B' },

    {
      type: 'rect', x: 0.5, y: 0.36, w: 0.78, h: 0.14, rx: 0.03,
      fill: '#6366F1', fill2: '#22D3EE',
      shadow: { color: 'rgba(99,102,241,0.35)', blur: 0.04 }
    },
    { type: 'text', x: 0.5, y: 0.33, text: 'الرصيد الحالي', fontFamily: 'Tajawal', size: 0.024, fill: '#E0E7FF' },
    { type: 'text', x: 0.5, y: 0.385, text: '12,480.00 ج.م', fontFamily: 'Cairo', size: 0.052, fill: '#FFFFFF', fontWeight: 900 },

    { type: 'circle', x: 0.255, y: 0.535, size: 0.085, fill: '#1E293B' },
    { type: 'circle', x: 0.415, y: 0.535, size: 0.085, fill: '#1E293B' },
    { type: 'circle', x: 0.585, y: 0.535, size: 0.085, fill: '#1E293B' },
    { type: 'circle', x: 0.745, y: 0.535, size: 0.085, fill: '#1E293B' },
    { type: 'text', x: 0.255, y: 0.585, text: 'تحويل', fontFamily: 'Tajawal', size: 0.02, fill: '#CBD5E1' },
    { type: 'text', x: 0.415, y: 0.585, text: 'دفع', fontFamily: 'Tajawal', size: 0.02, fill: '#CBD5E1' },
    { type: 'text', x: 0.585, y: 0.585, text: 'شحن', fontFamily: 'Tajawal', size: 0.02, fill: '#CBD5E1' },
    { type: 'text', x: 0.745, y: 0.585, text: 'المزيد', fontFamily: 'Tajawal', size: 0.02, fill: '#CBD5E1' },

    { type: 'text', x: 0.5, y: 0.655, text: 'آخر العمليات', fontFamily: 'Cairo', size: 0.03, fill: '#FFFFFF', fontWeight: 800 },

    { type: 'rect', x: 0.5, y: 0.715, w: 0.78, h: 0.055, rx: 0.018, fill: '#16213A' },
    { type: 'rect', x: 0.5, y: 0.785, w: 0.78, h: 0.055, rx: 0.018, fill: '#16213A' },
    { type: 'rect', x: 0.5, y: 0.855, w: 0.78, h: 0.055, rx: 0.018, fill: '#16213A' },
    { type: 'circle', x: 0.2, y: 0.715, size: 0.045, fill: '#22D3EE' },
    { type: 'circle', x: 0.2, y: 0.785, size: 0.045, fill: '#818CF8' },
    { type: 'circle', x: 0.2, y: 0.855, size: 0.045, fill: '#34D399' },
    { type: 'text', x: 0.56, y: 0.715, w: 0.5, text: 'أوبر · 85 ج.م', fontFamily: 'Tajawal', size: 0.023, fill: '#E2E8F0' },
    { type: 'text', x: 0.56, y: 0.785, w: 0.5, text: 'سوبر ماركت · 240 ج.م', fontFamily: 'Tajawal', size: 0.023, fill: '#E2E8F0' },
    { type: 'text', x: 0.56, y: 0.855, w: 0.5, text: 'راتب · +6,500 ج.م', fontFamily: 'Tajawal', size: 0.023, fill: '#E2E8F0' },

    { type: 'rect', x: 0.5, y: 0.93, w: 0.78, h: 0.05, rx: 0.025, fill: '#0B1220' },
    { type: 'circle', x: 0.28, y: 0.93, size: 0.022, fill: '#475569' },
    { type: 'circle', x: 0.43, y: 0.93, size: 0.022, fill: '#22D3EE' },
    { type: 'circle', x: 0.57, y: 0.93, size: 0.022, fill: '#475569' },
    { type: 'circle', x: 0.72, y: 0.93, size: 0.022, fill: '#475569' }
  ]
};
