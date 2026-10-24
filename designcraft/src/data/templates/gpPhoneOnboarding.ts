import type { DesignTemplate } from './types';

export const gpPhoneOnboarding: DesignTemplate = {
  id: 'gp-phone-onboarding',
  cat: 'gp-phone',
  nameAr: 'لقطة هاتف — خطوات البدء',
  nameEn: 'Phone Shot — Onboarding',
  descAr: 'لقطة 1080×1920 لشاشة ترحيب بثلاث خطوات وزر بدء',
  descEn: '1080×1920 welcome screen with three steps and a start CTA',
  isNew: true,
  exactSize: true,
  bg: '#0B1020',
  bg2: '#1E293B',
  baseW: 1080,
  baseH: 1920,
  objects: [
    { type: 'circle', x: 0.5, y: 0.08, size: 0.9, fill: '#22D3EE', opacity: 0.12 },
    { type: 'circle', x: 0.9, y: 0.02, size: 0.3, fill: '#6366F1', opacity: 0.16 },

    { type: 'text', x: 0.5, y: 0.075, w: 0.9, text: '3 خطوات\nوتبدأ', fontFamily: 'Cairo', size: 0.08, fill: '#FFFFFF', fontWeight: 900 },
    { type: 'text', x: 0.5, y: 0.145, w: 0.9, text: 'إعداد سريع بدون تعقيد', fontFamily: 'Tajawal', size: 0.03, fill: '#CBD5E1' },

    {
      type: 'rect', x: 0.5, y: 0.575, w: 0.9, h: 0.78, rx: 0.045, fill: '#0F172A',
      shadow: { color: 'rgba(2,6,23,0.5)', blur: 0.05, offsetY: 0.012 }
    },

    { type: 'rect', x: 0.18, y: 0.41, w: 0.004, h: 0.24, fill: '#334155' },
    { type: 'circle', x: 0.18, y: 0.29, size: 0.095, fill: '#22D3EE' },
    { type: 'circle', x: 0.18, y: 0.41, size: 0.095, fill: '#22D3EE', opacity: 0.7 },
    { type: 'circle', x: 0.18, y: 0.53, size: 0.095, fill: '#22D3EE', opacity: 0.45 },
    { type: 'text', x: 0.18, y: 0.29, text: '1', fontFamily: 'Cairo', size: 0.04, fill: '#04121F', fontWeight: 900 },
    { type: 'text', x: 0.18, y: 0.41, text: '2', fontFamily: 'Cairo', size: 0.04, fill: '#04121F', fontWeight: 900 },
    { type: 'text', x: 0.18, y: 0.53, text: '3', fontFamily: 'Cairo', size: 0.04, fill: '#04121F', fontWeight: 900 },

    { type: 'text', x: 0.6, y: 0.28, w: 0.64, text: 'أنشئ حسابك', fontFamily: 'Cairo', size: 0.032, fill: '#FFFFFF', fontWeight: 800 },
    { type: 'text', x: 0.6, y: 0.315, w: 0.64, text: 'بريدك أو رقم هاتفك في ثوانٍ', fontFamily: 'Tajawal', size: 0.019, fill: '#94A3B8' },
    { type: 'text', x: 0.6, y: 0.4, w: 0.64, text: 'خصّص تجربتك', fontFamily: 'Cairo', size: 0.032, fill: '#FFFFFF', fontWeight: 800 },
    { type: 'text', x: 0.6, y: 0.435, w: 0.64, text: 'اختر اهتماماتك ولونك المفضل', fontFamily: 'Tajawal', size: 0.019, fill: '#94A3B8' },
    { type: 'text', x: 0.6, y: 0.52, w: 0.64, text: 'ابدأ فورًا', fontFamily: 'Cairo', size: 0.032, fill: '#FFFFFF', fontWeight: 800 },
    { type: 'text', x: 0.6, y: 0.555, w: 0.64, text: 'كل شيء جاهز بدون خطوات زائدة', fontFamily: 'Tajawal', size: 0.019, fill: '#94A3B8' },

    {
      type: 'rect', x: 0.5, y: 0.7, w: 0.72, h: 0.075, rx: 0.0375,
      fill: '#22D3EE', fill2: '#6366F1',
      shadow: { color: 'rgba(34,211,238,0.3)', blur: 0.03 }
    },
    { type: 'text', x: 0.5, y: 0.7, text: 'يلا نبدأ', fontFamily: 'Cairo', size: 0.03, fill: '#04121F', fontWeight: 900 },

    { type: 'circle', x: 0.5, y: 0.87, size: 0.12, fill: '#1E293B' },
    { type: 'text', x: 0.5, y: 0.87, text: '✓', fontFamily: 'Cairo', size: 0.05, fill: '#22D3EE', fontWeight: 900 },
    { type: 'text', x: 0.5, y: 0.945, text: 'بدون بطاقة بنكية', fontFamily: 'Tajawal', size: 0.018, fill: '#64748B' }
  ]
};
