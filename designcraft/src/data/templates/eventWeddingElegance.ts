import type { DesignTemplate } from './types';

export const eventWeddingElegance: DesignTemplate = {
  id: 'event-wedding-elegance',
  cat: 'event',
  nameAr: 'دعوة زفاف أنيقة',
  nameEn: 'Elegant Wedding Invite',
  descAr: 'دعوة زفاف وردية بقوس أبيض وإطار ذهبي رفيع وخط عربي كلاسيكي',
  descEn: 'Blush wedding invite with a white arch, thin gold frame and classic Arabic type',
  isNew: true,
  bg: '#FDF2F8',
  bg2: '#FCE7F3',
  baseW: 1080,
  baseH: 1350,
  objects: [
    { type: 'circle', x: 0.5, y: 0.38, size: 0.78, fill: '#F9A8D4', opacity: 0.25 },
    { type: 'circle', x: 0.5, y: 0.38, size: 0.72, fill: '#FFFFFF', opacity: 0.78 },

    { type: 'circle', x: 0.12, y: 0.1, size: 0.22, fill: '#F9A8D4', opacity: 0.18 },
    { type: 'circle', x: 0.9, y: 0.92, size: 0.26, fill: '#F9A8D4', opacity: 0.18 },

    { type: 'rect', x: 0.5, y: 0.055, w: 0.82, h: 0.0025, fill: '#D4AF37', opacity: 0.55 },
    { type: 'rect', x: 0.5, y: 0.945, w: 0.82, h: 0.0025, fill: '#D4AF37', opacity: 0.55 },
    { type: 'rect', x: 0.075, y: 0.5, w: 0.0025, h: 0.86, fill: '#D4AF37', opacity: 0.55 },
    { type: 'rect', x: 0.925, y: 0.5, w: 0.0025, h: 0.86, fill: '#D4AF37', opacity: 0.55 },

    { type: 'text', x: 0.5, y: 0.13, text: 'دعوة زفاف', fontFamily: 'Amiri', size: 0.032, fill: '#9D174D', fontWeight: 700 },

    { type: 'circle', x: 0.5, y: 0.23, size: 0.115, fill: '#F9A8D4', fill2: '#FBCFE8' },
    { type: 'text', x: 0.5, y: 0.23, text: 'ل & ع', fontFamily: 'Amiri', size: 0.032, fill: '#831843', fontWeight: 700 },

    { type: 'text', x: 0.5, y: 0.4, text: 'ليلى & عمر', fontFamily: 'Amiri', size: 0.098, fill: '#831843', fontWeight: 700 },
    { type: 'rect', x: 0.5, y: 0.475, w: 0.16, h: 0.003, fill: '#D4AF37' },
    { type: 'circle', x: 0.5, y: 0.475, size: 0.018, fill: '#D4AF37' },

    { type: 'text', x: 0.5, y: 0.56, text: 'نتشرّف بدعوتكم لحضور حفل زفافنا', fontFamily: 'Tajawal', size: 0.032, fill: '#9D174D' },

    { type: 'text', x: 0.5, y: 0.66, text: '12 يونيو 2026', fontFamily: 'Amiri', size: 0.048, fill: '#831843', fontWeight: 700 },
    { type: 'text', x: 0.5, y: 0.72, text: 'قاعة الأندلس · الرياض', fontFamily: 'Tajawal', size: 0.028, fill: '#BE185D' },

    { type: 'rect', x: 0.5, y: 0.78, w: 0.1, h: 0.002, fill: '#D4AF37', opacity: 0.8 },

    { type: 'text', x: 0.5, y: 0.855, text: 'حضوركم يزيدنا بهجة', fontFamily: 'Amiri', size: 0.03, fill: '#9D174D' }
  ]
};
