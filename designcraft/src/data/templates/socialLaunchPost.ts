import type { DesignTemplate } from './types';

export const socialLaunchPost: DesignTemplate = {
  id: 'social-post-announcement',
  cat: 'social',
  nameAr: 'منشور إعلان جديد',
  nameEn: 'New Launch Post',
  descAr: 'إعلان نظيف بخلفية فاتحة ولمسات زرقاء ناعمة',
  descEn: 'Clean launch announcement with soft blue accents',
  bg: '#FFFFFF',
  bg2: '#E0F2FE',
  baseW: 1080,
  baseH: 1080,
  objects: [
    { type: 'circle', x: 0.82, y: 0.18, size: 0.6, fill: '#BFDBFE', opacity: 0.45 },
    { type: 'circle', x: 0.1, y: 0.88, size: 0.45, fill: '#C7D2FE', opacity: 0.5 },
    { type: 'circle', x: 0.9, y: 0.55, size: 0.18, fill: '#FFFFFF', opacity: 0.6 },

    {
      type: 'rect', x: 0.5, y: 0.14, w: 0.22, h: 0.06, rx: 0.03,
      fill: '#0EA5E9', fill2: '#2563EB',
      shadow: { color: 'rgba(37,99,235,0.3)', blur: 0.03 }
    },
    { type: 'text', x: 0.5, y: 0.14, text: 'جديد', fontFamily: 'Cairo', size: 0.027, fill: '#FFFFFF', fontWeight: 800 },

    { type: 'text', x: 0.5, y: 0.4, w: 0.8, text: 'أطلقنا المنتج\nاللي كنتوا طلبوه', fontFamily: 'Cairo', size: 0.082, fill: '#0F172A', fontWeight: 800 },
    { type: 'rect', x: 0.5, y: 0.55, w: 0.12, h: 0.008, fill: '#0EA5E9' },
    { type: 'text', x: 0.5, y: 0.65, w: 0.62, text: 'متاح الآن في كل الفروع\nوعلى الموقع الرسمي', fontFamily: 'Tajawal', size: 0.038, fill: '#475569' },

    { type: 'rect', x: 0.5, y: 0.8, w: 0.38, h: 0.066, rx: 0.033, fill: '#0F172A' },
    { type: 'text', x: 0.5, y: 0.8, text: 'اعرف المزيد', fontFamily: 'Cairo', size: 0.033, fill: '#FFFFFF', fontWeight: 700 }
  ]
};
