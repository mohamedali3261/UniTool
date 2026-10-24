import type { DesignTemplate } from './types';

export const gpTab10Chat: DesignTemplate = {
  id: 'gp-tab10-chat',
  cat: 'gp-tablet10',
  nameAr: 'تابلت 10 — محادثات',
  nameEn: '10" Tablet — Chat',
  descAr: 'لقطة 1600×2560 لمحادثات بشاشة مقسومة وقائمة واسعة',
  descEn: '1600×2560 split-view chat screenshot with a wide inbox list',
  isNew: true,
  exactSize: true,
  bg: '#0F172A',
  bg2: '#1E1B4B',
  baseW: 1600,
  baseH: 2560,
  objects: [
    { type: 'circle', x: 0.5, y: 0.1, size: 1, fill: '#38BDF8', opacity: 0.12 },

    { type: 'text', x: 0.5, y: 0.055, w: 0.9, text: 'تعاون\nبلا حدود', fontFamily: 'Cairo', size: 0.055, fill: '#FFFFFF', fontWeight: 900 },
    { type: 'text', x: 0.5, y: 0.115, w: 0.9, text: 'محادثات الفريق في مكان واحد', fontFamily: 'Tajawal', size: 0.023, fill: '#BAE6FD' },

    {
      type: 'rect', x: 0.5, y: 0.57, w: 0.94, h: 0.82, rx: 0.03, fill: '#F8FAFC',
      shadow: { color: 'rgba(2,6,23,0.5)', blur: 0.04, offsetY: 0.01 }
    },

    { type: 'rect', x: 0.21, y: 0.57, w: 0.26, h: 0.78, rx: 0.025, fill: '#FFFFFF' },
    { type: 'text', x: 0.21, y: 0.205, text: 'الرسائل', fontFamily: 'Cairo', size: 0.02, fill: '#0F172A', fontWeight: 900 },

    { type: 'rect', x: 0.21, y: 0.28, w: 0.22, h: 0.05, rx: 0.02, fill: '#DBEAFE' },
    { type: 'rect', x: 0.21, y: 0.35, w: 0.22, h: 0.05, rx: 0.02, fill: '#F1F5F9' },
    { type: 'rect', x: 0.21, y: 0.42, w: 0.22, h: 0.05, rx: 0.02, fill: '#F1F5F9' },
    { type: 'rect', x: 0.21, y: 0.49, w: 0.22, h: 0.05, rx: 0.02, fill: '#F1F5F9' },
    { type: 'rect', x: 0.21, y: 0.56, w: 0.22, h: 0.05, rx: 0.02, fill: '#F1F5F9' },
    { type: 'circle', x: 0.105, y: 0.28, size: 0.04, fill: '#38BDF8' },
    { type: 'circle', x: 0.105, y: 0.35, size: 0.04, fill: '#818CF8' },
    { type: 'circle', x: 0.105, y: 0.42, size: 0.04, fill: '#F472B6' },
    { type: 'circle', x: 0.105, y: 0.49, size: 0.04, fill: '#34D399' },
    { type: 'circle', x: 0.105, y: 0.56, size: 0.04, fill: '#FBBF24' },
    { type: 'text', x: 0.21, y: 0.28, text: 'فريق التصميم', fontFamily: 'Tajawal', size: 0.015, fill: '#1E3A8A' },
    { type: 'text', x: 0.21, y: 0.35, text: 'سارة', fontFamily: 'Tajawal', size: 0.015, fill: '#334155' },
    { type: 'text', x: 0.21, y: 0.42, text: 'مشروع 2026', fontFamily: 'Tajawal', size: 0.015, fill: '#334155' },
    { type: 'text', x: 0.21, y: 0.49, text: 'الدعم', fontFamily: 'Tajawal', size: 0.015, fill: '#334155' },
    { type: 'text', x: 0.21, y: 0.56, text: 'الإدارة', fontFamily: 'Tajawal', size: 0.015, fill: '#334155' },

    { type: 'rect', x: 0.355, y: 0.57, w: 0.0025, h: 0.74, fill: '#E2E8F0' },

    { type: 'text', x: 0.67, y: 0.21, text: 'فريق التصميم', fontFamily: 'Cairo', size: 0.02, fill: '#0F172A', fontWeight: 900 },
    { type: 'text', x: 0.67, y: 0.235, text: '5 أعضاء متصلون', fontFamily: 'Tajawal', size: 0.014, fill: '#10B981' },

    { type: 'rect', x: 0.52, y: 0.33, w: 0.42, h: 0.09, rx: 0.025, fill: '#E2E8F0' },
    { type: 'text', x: 0.52, y: 0.33, w: 0.38, text: 'جاهز للنسخة النهائية؟', fontFamily: 'Tajawal', size: 0.016, fill: '#334155' },

    { type: 'rect', x: 0.8, y: 0.45, w: 0.34, h: 0.085, rx: 0.025, fill: '#38BDF8' },
    { type: 'text', x: 0.8, y: 0.45, w: 0.3, text: 'أرسلتها للتو', fontFamily: 'Tajawal', size: 0.016, fill: '#082F49' },

    { type: 'rect', x: 0.52, y: 0.57, w: 0.44, h: 0.11, rx: 0.025, fill: '#E2E8F0' },
    { type: 'text', x: 0.52, y: 0.57, w: 0.4, text: 'راجع التعديلات\nعلى الشاشة الرئيسية', fontFamily: 'Tajawal', size: 0.016, fill: '#334155' },

    { type: 'rect', x: 0.82, y: 0.72, w: 0.3, h: 0.08, rx: 0.025, fill: '#38BDF8' },
    { type: 'text', x: 0.82, y: 0.72, w: 0.26, text: 'تمام، شكرًا', fontFamily: 'Tajawal', size: 0.016, fill: '#082F49' },

    { type: 'rect', x: 0.55, y: 0.84, w: 0.38, h: 0.08, rx: 0.02, fill: '#FFFFFF', shadow: { color: 'rgba(15,23,42,0.1)', blur: 0.015 } },
    { type: 'circle', x: 0.4, y: 0.84, size: 0.05, fill: '#6366F1' },
    { type: 'text', x: 0.4, y: 0.84, text: 'PDF', fontFamily: 'Cairo', size: 0.011, fill: '#FFFFFF', fontWeight: 900 },
    { type: 'text', x: 0.58, y: 0.84, w: 0.3, text: 'ملف المشروع.pdf', fontFamily: 'Tajawal', size: 0.015, fill: '#334155' },

    { type: 'rect', x: 0.69, y: 0.935, w: 0.44, h: 0.05, rx: 0.025, fill: '#FFFFFF' },
    { type: 'text', x: 0.69, y: 0.935, text: 'اكتب رسالة...', fontFamily: 'Tajawal', size: 0.015, fill: '#94A3B8' },
    { type: 'circle', x: 0.91, y: 0.935, size: 0.05, fill: '#38BDF8' },
    { type: 'text', x: 0.91, y: 0.935, text: '▶', fontFamily: 'Cairo', size: 0.015, fill: '#FFFFFF', fontWeight: 900 }
  ]
};
