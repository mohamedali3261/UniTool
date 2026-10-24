import type { DesignTemplate } from './types';

export const gpIconGradientA: DesignTemplate = {
  id: 'gp-icon-gradient-a',
  cat: 'gp-icon',
  nameAr: 'أيقونة حرف متدرج',
  nameEn: 'Gradient Monogram Icon',
  descAr: 'أيقونة 512×512 بحرف بارز وتدرج بنفسجي-سماوي',
  descEn: '512×512 icon with a bold monogram and violet-cyan gradient',
  isNew: true,
  exactSize: true,
  bg: '#4F46E5',
  bg2: '#06B6D4',
  baseW: 512,
  baseH: 512,
  objects: [
    { type: 'circle', x: 0.5, y: 0.5, size: 0.9, fill: '#FFFFFF', opacity: 0.06 },
    { type: 'circle', x: 0.82, y: 0.16, size: 0.34, fill: '#FFFFFF', opacity: 0.12 },
    { type: 'circle', x: 0.14, y: 0.86, size: 0.24, fill: '#FFFFFF', opacity: 0.1 },

    { type: 'text', x: 0.5, y: 0.47, text: 'A', fontFamily: 'Cairo', size: 0.46, fill: '#FFFFFF', fontWeight: 900 },
    { type: 'rect', x: 0.5, y: 0.72, w: 0.28, h: 0.012, rx: 0.006, fill: '#FFFFFF', opacity: 0.5 },
    { type: 'text', x: 0.5, y: 0.8, text: 'APP', fontFamily: 'Cairo', size: 0.055, fill: '#E0E7FF', fontWeight: 800 }
  ]
};
