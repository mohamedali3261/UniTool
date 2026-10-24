import type { DesignTemplate } from './types';

export const eventWebinar: DesignTemplate = {
  id: 'event-webinar',
  cat: 'event',
  nameAr: 'إعلان ندوة مجانية',
  nameEn: 'Free Webinar Announce',
  descAr: 'إعلان بتدرج زمردي مع شارة ذهبية وموعد وزر حجز',
  descEn: 'Emerald event card with gold badge, date row and RSVP button',
  bg: '#022C22',
  bg2: '#065F46',
  baseW: 1080,
  baseH: 1080,
  objects: [
    { type: 'circle', x: 0.5, y: 0.5, size: 0.8, fill: '#10B981', opacity: 0.12 },

    {
      type: 'rect', x: 0.5, y: 0.12, w: 0.28, h: 0.056, rx: 0.028,
      fill: '#FBBF24', fill2: '#F59E0B',
      shadow: { color: 'rgba(251,191,36,0.4)', blur: 0.03 }
    },
    { type: 'text', x: 0.5, y: 0.12, text: 'ندوة مجانية', fontFamily: 'Cairo', size: 0.028, fill: '#064E3B', fontWeight: 900 },

    { type: 'text', x: 0.5, y: 0.34, w: 0.8, text: 'أساسيات التصميم\nلأصحاب المشاريع', fontFamily: 'Cairo', size: 0.072, fill: '#FFFFFF', fontWeight: 800 },
    { type: 'rect', x: 0.5, y: 0.475, w: 0.16, h: 0.006, fill: '#FBBF24', opacity: 0.75 },

    { type: 'rect', x: 0.5, y: 0.6, w: 0.5, h: 0.058, rx: 0.029, fill: '#FFFFFF', opacity: 0.12 },
    { type: 'text', x: 0.5, y: 0.6, text: 'الأحد · 8 مساءً · أونلاين', fontFamily: 'Tajawal', size: 0.033, fill: '#D1FAE5' },

    {
      type: 'rect', x: 0.5, y: 0.775, w: 0.38, h: 0.07, rx: 0.035,
      fill: '#FBBF24', fill2: '#F59E0B',
      shadow: { color: 'rgba(245,158,11,0.45)', blur: 0.04, offsetY: 0.008 }
    },
    { type: 'text', x: 0.5, y: 0.775, text: 'احجز مكانك مجانًا', fontFamily: 'Cairo', size: 0.034, fill: '#064E3B', fontWeight: 900 },

    { type: 'text', x: 0.5, y: 0.9, text: 'مقاعد محدودة · شهادة حضور', fontFamily: 'Tajawal', size: 0.024, fill: '#A7F3D0', opacity: 0.9 }
  ]
};
