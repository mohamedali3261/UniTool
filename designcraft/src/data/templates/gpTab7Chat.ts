import type { DesignTemplate } from './types';

export const gpTab7Chat: DesignTemplate = {
  id: 'gp-tab7-chat',
  cat: 'gp-tablet7',
  nameAr: 'تابلت 7 — محادثات',
  nameEn: '7" Tablet — Chat',
  descAr: 'لقطة 1200×1920 بواجهة محادثات مقسومة: قائمة ومحادثة',
  descEn: '1200×1920 split-view chat UI with an inbox list and conversation',
  isNew: true,
  exactSize: true,
  bg: '#0F172A',
  bg2: '#1E1B4B',
  baseW: 1200,
  baseH: 1920,
  objects: [
    { type: 'circle', x: 0.5, y: 0.1, size: 1, fill: '#38BDF8', opacity: 0.12 },

    { type: 'text', x: 0.5, y: 0.07, w: 0.9, text: 'محادثات\nأوضح', fontFamily: 'Cairo', size: 0.062, fill: '#FFFFFF', fontWeight: 900 },
    { type: 'text', x: 0.5, y: 0.13, w: 0.9, text: 'كل فريقك في شاشة واحدة', fontFamily: 'Tajawal', size: 0.026, fill: '#BAE6FD' },

    {
      type: 'rect', x: 0.5, y: 0.585, w: 0.94, h: 0.79, rx: 0.04, fill: '#F8FAFC',
      shadow: { color: 'rgba(2,6,23,0.5)', blur: 0.045, offsetY: 0.012 }
    },

    { type: 'rect', x: 0.24, y: 0.585, w: 0.3, h: 0.75, rx: 0.03, fill: '#FFFFFF' },
    { type: 'text', x: 0.24, y: 0.23, text: 'الرسائل', fontFamily: 'Cairo', size: 0.024, fill: '#0F172A', fontWeight: 900 },

    { type: 'rect', x: 0.24, y: 0.32, w: 0.25, h: 0.055, rx: 0.025, fill: '#DBEAFE' },
    { type: 'rect', x: 0.24, y: 0.39, w: 0.25, h: 0.055, rx: 0.025, fill: '#F1F5F9' },
    { type: 'rect', x: 0.24, y: 0.46, w: 0.25, h: 0.055, rx: 0.025, fill: '#F1F5F9' },
    { type: 'rect', x: 0.24, y: 0.53, w: 0.25, h: 0.055, rx: 0.025, fill: '#F1F5F9' },
    { type: 'circle', x: 0.135, y: 0.32, size: 0.045, fill: '#38BDF8' },
    { type: 'circle', x: 0.135, y: 0.39, size: 0.045, fill: '#818CF8' },
    { type: 'circle', x: 0.135, y: 0.46, size: 0.045, fill: '#F472B6' },
    { type: 'circle', x: 0.135, y: 0.53, size: 0.045, fill: '#34D399' },
    { type: 'text', x: 0.24, y: 0.32, text: 'فريق التصميم', fontFamily: 'Tajawal', size: 0.017, fill: '#1E3A8A' },
    { type: 'text', x: 0.24, y: 0.39, text: 'سارة أحمد', fontFamily: 'Tajawal', size: 0.017, fill: '#334155' },
    { type: 'text', x: 0.24, y: 0.46, text: 'مشروع 2026', fontFamily: 'Tajawal', size: 0.017, fill: '#334155' },
    { type: 'text', x: 0.24, y: 0.53, text: 'الدعم الفني', fontFamily: 'Tajawal', size: 0.017, fill: '#334155' },

    { type: 'rect', x: 0.45, y: 0.585, w: 0.003, h: 0.72, fill: '#E2E8F0' },

    { type: 'text', x: 0.7, y: 0.235, text: 'فريق التصميم', fontFamily: 'Cairo', size: 0.024, fill: '#0F172A', fontWeight: 900 },
    { type: 'text', x: 0.7, y: 0.265, text: '5 أعضاء متصلون', fontFamily: 'Tajawal', size: 0.016, fill: '#10B981' },

    { type: 'rect', x: 0.55, y: 0.38, w: 0.38, h: 0.1, rx: 0.03, fill: '#E2E8F0' },
    { type: 'text', x: 0.55, y: 0.38, w: 0.34, text: 'جاهز للنسخة النهائية؟', fontFamily: 'Tajawal', size: 0.019, fill: '#334155' },

    { type: 'rect', x: 0.78, y: 0.5, w: 0.34, h: 0.1, rx: 0.03, fill: '#38BDF8' },
    { type: 'text', x: 0.78, y: 0.5, w: 0.3, text: 'أرسلتها للتو', fontFamily: 'Tajawal', size: 0.019, fill: '#082F49' },

    { type: 'rect', x: 0.55, y: 0.62, w: 0.4, h: 0.13, rx: 0.03, fill: '#E2E8F0' },
    { type: 'text', x: 0.55, y: 0.62, w: 0.36, text: 'راجع التعديلات\nعلى الشاشة الرئيسية', fontFamily: 'Tajawal', size: 0.019, fill: '#334155' },

    { type: 'rect', x: 0.8, y: 0.78, w: 0.3, h: 0.09, rx: 0.03, fill: '#38BDF8' },
    { type: 'text', x: 0.8, y: 0.78, w: 0.26, text: 'تمام', fontFamily: 'Tajawal', size: 0.019, fill: '#082F49' },

    { type: 'rect', x: 0.7, y: 0.9, w: 0.42, h: 0.06, rx: 0.03, fill: '#FFFFFF' },
    { type: 'text', x: 0.7, y: 0.9, text: 'اكتب رسالة...', fontFamily: 'Tajawal', size: 0.018, fill: '#94A3B8' },
    { type: 'circle', x: 0.93, y: 0.9, size: 0.06, fill: '#38BDF8' },
    { type: 'text', x: 0.93, y: 0.9, text: '▶', fontFamily: 'Cairo', size: 0.018, fill: '#FFFFFF', fontWeight: 900 }
  ]
};
