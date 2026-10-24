import type { DesignTemplate } from './types';

export const socialGradientDrop: DesignTemplate = {
  id: 'social-gradient-drop',
  cat: 'social',
  nameAr: 'إطلاق بتدرج نيون',
  nameEn: 'Neon Gradient Drop',
  descAr: 'تدرج سماوي-بنفسجي مع كارت زجاجي وكود خصم للإطلاق',
  descEn: 'Cyan-to-violet gradient with a glass card and launch coupon',
  isNew: true,
  bg: '#0EA5E9',
  bg2: '#7C3AED',
  baseW: 1080,
  baseH: 1350,
  objects: [
    { type: 'circle', x: 0.18, y: 0.18, size: 0.55, fill: '#FFFFFF', opacity: 0.12 },
    { type: 'circle', x: 0.86, y: 0.78, size: 0.5, fill: '#FDE047', opacity: 0.15 },
    { type: 'circle', x: 0.5, y: 0.5, size: 0.95, fill: '#4C1D95', opacity: 0.22 },

    { type: 'text', x: 0.5, y: 0.1, text: 'NEW DROP · 2026', fontFamily: 'Montserrat', size: 0.022, fill: '#FFFFFF', fontWeight: 700, opacity: 0.9 },
    {
      type: 'text', x: 0.5, y: 0.29, w: 0.8, text: 'مجموعة\nالصيف', fontFamily: 'Cairo', size: 0.125,
      fill: '#FFFFFF', fontWeight: 900,
      shadow: { color: 'rgba(76,29,149,0.35)', blur: 0.02 }
    },
    { type: 'rect', x: 0.5, y: 0.4, w: 0.16, h: 0.006, fill: '#FDE047' },
    { type: 'text', x: 0.5, y: 0.47, w: 0.72, text: 'تصاميم محدودة… أول من يكتشفها يكسب', fontFamily: 'Tajawal', size: 0.036, fill: '#E0F2FE' },

    {
      type: 'rect', x: 0.5, y: 0.665, w: 0.68, h: 0.18, rx: 0.04,
      fill: '#FFFFFF', opacity: 0.16,
      shadow: { color: 'rgba(30,27,75,0.25)', blur: 0.025, offsetY: 0.006 }
    },
    { type: 'text', x: 0.5, y: 0.64, text: 'خصم الإطلاق 25%', fontFamily: 'Cairo', size: 0.046, fill: '#FFFFFF', fontWeight: 800 },
    { type: 'text', x: 0.5, y: 0.7, text: 'كود: SUMMER26', fontFamily: 'Cairo', size: 0.03, fill: '#FDE047', fontWeight: 700 },

    { type: 'rect', x: 0.5, y: 0.855, w: 0.42, h: 0.062, rx: 0.031, fill: '#FFFFFF' },
    { type: 'text', x: 0.5, y: 0.855, text: 'اكتشف المجموعة', fontFamily: 'Cairo', size: 0.034, fill: '#6D28D9', fontWeight: 900 },

    { type: 'text', x: 0.5, y: 0.93, text: 'لفترة محدودة', fontFamily: 'Tajawal', size: 0.023, fill: '#FFFFFF', opacity: 0.75 }
  ]
};
