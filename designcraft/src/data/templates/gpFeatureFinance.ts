import type { DesignTemplate } from './types';

export const gpFeatureFinance: DesignTemplate = {
  id: 'gp-feature-finance',
  cat: 'gp-feature',
  nameAr: 'بنر تمويل أخضر',
  nameEn: 'Finance Green Banner',
  descAr: 'بنر 1024×500 أخضر داكن مع بطاقة رصيد عائمة وزر فتح حساب',
  descEn: '1024×500 deep green banner with a floating balance card and CTA',
  isNew: true,
  exactSize: true,
  bg: '#052E16',
  bg2: '#064E3B',
  baseW: 1024,
  baseH: 500,
  objects: [
    { type: 'circle', x: 0.1, y: 0.5, size: 0.7, fill: '#34D399', opacity: 0.12 },

    { type: 'text', x: 0.38, y: 0.35, w: 0.55, text: 'أموالك\nبأمان تام', fontFamily: 'Cairo', size: 0.085, fill: '#FFFFFF', fontWeight: 900 },
    { type: 'text', x: 0.38, y: 0.55, w: 0.5, text: 'تحويلات فورية · تقارير ذكية', fontFamily: 'Tajawal', size: 0.032, fill: '#A7F3D0' },

    {
      type: 'rect', x: 0.38, y: 0.76, w: 0.26, h: 0.1, rx: 0.05, fill: '#34D399',
      shadow: { color: 'rgba(52,211,153,0.35)', blur: 0.03 }
    },
    { type: 'text', x: 0.38, y: 0.76, text: 'افتح حسابك', fontFamily: 'Cairo', size: 0.032, fill: '#052E16', fontWeight: 900 },

    {
      type: 'rect', x: 0.82, y: 0.5, w: 0.26, h: 0.5, rx: 0.05, fill: '#ECFDF5',
      shadow: { color: 'rgba(0,0,0,0.35)', blur: 0.04, offsetY: 0.015 }
    },
    { type: 'text', x: 0.82, y: 0.44, text: '12,480', fontFamily: 'Cairo', size: 0.065, fill: '#064E3B', fontWeight: 900 },
    { type: 'text', x: 0.82, y: 0.505, text: 'ج.م', fontFamily: 'Tajawal', size: 0.026, fill: '#059669', fontWeight: 700 },
    { type: 'rect', x: 0.82, y: 0.59, w: 0.16, h: 0.032, rx: 0.016, fill: '#A7F3D0' },
    { type: 'text', x: 0.82, y: 0.59, text: '+18.4%', fontFamily: 'Cairo', size: 0.02, fill: '#065F46', fontWeight: 800 },

    { type: 'circle', x: 0.72, y: 0.69, size: 0.07, fill: '#FBBF24' }
  ]
};
