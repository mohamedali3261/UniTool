import type { DesignTemplate } from './types';

export const gpIconCamera: DesignTemplate = {
  id: 'gp-icon-camera',
  cat: 'gp-icon',
  nameAr: 'أيقونة كاميرا',
  nameEn: 'Camera Lens Icon',
  descAr: 'كاميرا برتقالية بعدسة بارزة ولمعة سماوية — 512×512',
  descEn: 'Orange camera with a bold lens and cyan glint — 512×512',
  isNew: true,
  exactSize: true,
  bg: '#F97316',
  bg2: '#EF4444',
  baseW: 512,
  baseH: 512,
  objects: [
    { type: 'circle', x: 0.5, y: 0.5, size: 0.92, fill: '#FFFFFF', opacity: 0.07 },

    {
      type: 'rect', x: 0.5, y: 0.53, w: 0.64, h: 0.5, rx: 0.11, fill: '#111827',
      shadow: { color: 'rgba(17,24,39,0.45)', blur: 0.06, offsetY: 0.02 }
    },
    { type: 'rect', x: 0.5, y: 0.29, w: 0.26, h: 0.05, rx: 0.025, fill: '#1F2937' },

    { type: 'circle', x: 0.5, y: 0.53, size: 0.33, fill: '#0B1220' },
    { type: 'circle', x: 0.5, y: 0.53, size: 0.22, fill: '#1E293B' },
    { type: 'circle', x: 0.56, y: 0.47, size: 0.075, fill: '#38BDF8', opacity: 0.95 },

    { type: 'rect', x: 0.72, y: 0.31, w: 0.1, h: 0.045, rx: 0.022, fill: '#FDE68A' },

    { type: 'text', x: 0.5, y: 0.84, text: 'snap', fontFamily: 'Cairo', size: 0.05, fill: '#FFFFFF', fontWeight: 800, opacity: 0.9 }
  ]
};
