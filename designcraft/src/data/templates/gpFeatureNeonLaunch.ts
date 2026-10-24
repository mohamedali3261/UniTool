import type { DesignTemplate } from './types';

export const gpFeatureNeonLaunch: DesignTemplate = {
  id: 'gp-feature-neon-launch',
  cat: 'gp-feature',
  nameAr: 'بنر إطلاق نيون',
  nameEn: 'Neon Launch Banner',
  descAr: 'بنر متجر 1024×500 بإضاءة نيون وهاتف بارز وزر تحميل',
  descEn: '1024×500 store banner with neon glow, a phone mockup and download CTA',
  isNew: true,
  exactSize: true,
  bg: '#0B1020',
  bg2: '#1E1B4B',
  baseW: 1024,
  baseH: 500,
  objects: [
    { type: 'circle', x: 0.16, y: 0.5, size: 0.85, fill: '#6366F1', opacity: 0.25 },
    { type: 'circle', x: 0.9, y: 0.22, size: 0.5, fill: '#22D3EE', opacity: 0.15 },

    { type: 'rect', x: 0.36, y: 0.08, w: 0.08, h: 0.014, rx: 0.007, fill: '#22D3EE' },

    { type: 'text', x: 0.36, y: 0.38, w: 0.58, text: 'تطبيقك الجديد\nوصل أخيرًا', fontFamily: 'Cairo', size: 0.075, fill: '#FFFFFF', fontWeight: 900 },
    { type: 'text', x: 0.36, y: 0.58, w: 0.5, text: 'تجربة أسرع · تصميم أنظف · مجاني', fontFamily: 'Tajawal', size: 0.035, fill: '#93C5FD' },

    {
      type: 'rect', x: 0.36, y: 0.78, w: 0.22, h: 0.095, rx: 0.0475,
      fill: '#22D3EE', fill2: '#6366F1',
      shadow: { color: 'rgba(34,211,238,0.4)', blur: 0.03 }
    },
    { type: 'text', x: 0.36, y: 0.78, text: 'حمّل الآن', fontFamily: 'Cairo', size: 0.032, fill: '#04121F', fontWeight: 900 },

    {
      type: 'rect', x: 0.82, y: 0.5, w: 0.16, h: 0.44, rx: 0.05, fill: '#0F172A',
      shadow: { color: 'rgba(2,6,23,0.6)', blur: 0.04, offsetY: 0.01 }
    },
    { type: 'rect', x: 0.82, y: 0.5, w: 0.135, h: 0.38, rx: 0.035, fill: '#111C3A' },
    { type: 'circle', x: 0.82, y: 0.43, size: 0.11, fill: '#22D3EE', fill2: '#6366F1' },
    { type: 'text', x: 0.82, y: 0.53, text: 'APP', fontFamily: 'Cairo', size: 0.028, fill: '#FFFFFF', fontWeight: 900 },

    { type: 'circle', x: 0.91, y: 0.31, size: 0.07, fill: '#F43F5E' },
    { type: 'text', x: 0.91, y: 0.31, text: 'NEW', fontFamily: 'Cairo', size: 0.016, fill: '#FFFFFF', fontWeight: 900 }
  ]
};
