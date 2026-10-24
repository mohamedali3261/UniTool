import type { DesignTemplate } from './types';

export const gpPhoneChat: DesignTemplate = {
  id: 'gp-phone-chat',
  cat: 'gp-phone',
  nameAr: 'لقطة هاتف — محادثة',
  nameEn: 'Phone Shot — Chat',
  descAr: 'لقطة 1080×1920 لواجهة محادثة فاتحة بفقاعات واضحة',
  descEn: '1080×1920 screenshot of a clean light chat UI with clear bubbles',
  isNew: true,
  exactSize: true,
  bg: '#0F172A',
  bg2: '#1E1B4B',
  baseW: 1080,
  baseH: 1920,
  objects: [
    { type: 'circle', x: 0.5, y: 0.1, size: 1, fill: '#38BDF8', opacity: 0.12 },

    { type: 'text', x: 0.5, y: 0.075, w: 0.9, text: 'تواصل أسرع\nوأقرب', fontFamily: 'Cairo', size: 0.075, fill: '#FFFFFF', fontWeight: 900 },
    { type: 'text', x: 0.5, y: 0.14, w: 0.9, text: 'محادثات فورية ومكالمات واضحة', fontFamily: 'Tajawal', size: 0.03, fill: '#BAE6FD' },

    {
      type: 'rect', x: 0.5, y: 0.575, w: 0.9, h: 0.78, rx: 0.045, fill: '#F1F5F9',
      shadow: { color: 'rgba(2,6,23,0.5)', blur: 0.05, offsetY: 0.012 }
    },

    { type: 'rect', x: 0.5, y: 0.215, w: 0.9, h: 0.09, rx: 0.02, fill: '#FFFFFF' },
    { type: 'text', x: 0.5, y: 0.207, text: 'سارة أحمد', fontFamily: 'Cairo', size: 0.03, fill: '#0F172A', fontWeight: 800 },
    { type: 'text', x: 0.5, y: 0.242, text: 'متصل الآن', fontFamily: 'Tajawal', size: 0.017, fill: '#10B981' },
    { type: 'circle', x: 0.15, y: 0.215, size: 0.07, fill: '#38BDF8' },
    { type: 'text', x: 0.15, y: 0.215, text: 'س', fontFamily: 'Cairo', size: 0.03, fill: '#FFFFFF', fontWeight: 900 },

    { type: 'rect', x: 0.38, y: 0.33, w: 0.52, h: 0.075, rx: 0.035, fill: '#E2E8F0' },
    { type: 'text', x: 0.38, y: 0.33, w: 0.46, text: 'أهلًا! جاهز للمكالمة؟', fontFamily: 'Tajawal', size: 0.023, fill: '#334155' },

    { type: 'rect', x: 0.62, y: 0.43, w: 0.5, h: 0.075, rx: 0.035, fill: '#38BDF8' },
    { type: 'text', x: 0.62, y: 0.43, w: 0.44, text: 'أكيد، بعد ٥ دقائق', fontFamily: 'Tajawal', size: 0.023, fill: '#082F49' },

    { type: 'rect', x: 0.38, y: 0.54, w: 0.56, h: 0.1, rx: 0.035, fill: '#E2E8F0' },
    { type: 'text', x: 0.38, y: 0.54, w: 0.5, text: 'تمام، هبعتلك\nملف المشروع', fontFamily: 'Tajawal', size: 0.023, fill: '#334155' },

    { type: 'rect', x: 0.64, y: 0.66, w: 0.44, h: 0.075, rx: 0.035, fill: '#38BDF8' },
    { type: 'text', x: 0.64, y: 0.66, w: 0.38, text: 'استلمته، شكرًا', fontFamily: 'Tajawal', size: 0.023, fill: '#082F49' },

    { type: 'rect', x: 0.42, y: 0.78, w: 0.6, h: 0.1, rx: 0.025, fill: '#FFFFFF', shadow: { color: 'rgba(15,23,42,0.12)', blur: 0.02 } },
    { type: 'circle', x: 0.19, y: 0.78, size: 0.06, fill: '#6366F1' },
    { type: 'text', x: 0.19, y: 0.78, text: 'PDF', fontFamily: 'Cairo', size: 0.014, fill: '#FFFFFF', fontWeight: 900 },
    { type: 'text', x: 0.48, y: 0.765, w: 0.4, text: 'مشروع-2026.pdf', fontFamily: 'Tajawal', size: 0.022, fill: '#0F172A', fontWeight: 700 },
    { type: 'text', x: 0.48, y: 0.797, w: 0.4, text: '2.4 MB', fontFamily: 'Cairo', size: 0.017, fill: '#94A3B8' },

    { type: 'rect', x: 0.5, y: 0.9, w: 0.8, h: 0.065, rx: 0.0325, fill: '#FFFFFF' },
    { type: 'text', x: 0.5, y: 0.9, text: 'اكتب رسالة...', fontFamily: 'Tajawal', size: 0.022, fill: '#94A3B8' },
    { type: 'circle', x: 0.85, y: 0.9, size: 0.065, fill: '#38BDF8' },
    { type: 'text', x: 0.85, y: 0.9, text: '▶', fontFamily: 'Cairo', size: 0.02, fill: '#FFFFFF', fontWeight: 900 }
  ]
};
