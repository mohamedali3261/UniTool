import type { DesignTemplate } from './types';

export const gpIconChat: DesignTemplate = {
  id: 'gp-icon-chat',
  cat: 'gp-icon',
  nameAr: 'أيقونة محادثة',
  nameEn: 'Chat Bubble Icon',
  descAr: 'فقاعة محادثة متدرجة مع شارة إشعارات — 512×512',
  descEn: 'Gradient chat bubble with a notification badge — 512×512',
  isNew: true,
  exactSize: true,
  bg: '#0F172A',
  bg2: '#1E293B',
  baseW: 512,
  baseH: 512,
  objects: [
    { type: 'circle', x: 0.5, y: 0.5, size: 0.95, fill: '#38BDF8', opacity: 0.08 },

    {
      type: 'rect', x: 0.48, y: 0.47, w: 0.66, h: 0.46, rx: 0.15,
      fill: '#38BDF8', fill2: '#6366F1',
      shadow: { color: 'rgba(56,189,248,0.35)', blur: 0.06, offsetY: 0.015 }
    },
    { type: 'circle', x: 0.29, y: 0.68, size: 0.14, fill: '#38BDF8' },

    { type: 'circle', x: 0.35, y: 0.47, size: 0.095, fill: '#FFFFFF' },
    { type: 'circle', x: 0.48, y: 0.47, size: 0.095, fill: '#FFFFFF' },
    { type: 'circle', x: 0.61, y: 0.47, size: 0.095, fill: '#FFFFFF' },

    {
      type: 'circle', x: 0.76, y: 0.24, size: 0.18, fill: '#F43F5E',
      shadow: { color: 'rgba(244,63,94,0.45)', blur: 0.04 }
    },
    { type: 'text', x: 0.76, y: 0.24, text: '3', fontFamily: 'Cairo', size: 0.075, fill: '#FFFFFF', fontWeight: 900 },

    { type: 'text', x: 0.5, y: 0.84, text: 'chat', fontFamily: 'Cairo', size: 0.055, fill: '#93C5FD', fontWeight: 800 }
  ]
};
