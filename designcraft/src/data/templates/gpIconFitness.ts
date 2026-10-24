import type { DesignTemplate } from './types';

export const gpIconFitness: DesignTemplate = {
  id: 'gp-icon-fitness',
  cat: 'gp-icon',
  nameAr: 'أيقونة لياقة',
  nameEn: 'Fitness Bars Icon',
  descAr: 'أيقونة 512×512 خضراء بأعمدة أداء وكلمة FIT',
  descEn: 'Green 512×512 icon with performance bars and a FIT wordmark',
  isNew: true,
  exactSize: true,
  bg: '#052E16',
  bg2: '#065F46',
  baseW: 512,
  baseH: 512,
  objects: [
    { type: 'circle', x: 0.5, y: 0.52, size: 0.86, fill: '#4ADE80', opacity: 0.12 },

    { type: 'text', x: 0.5, y: 0.34, text: 'FIT', fontFamily: 'Cairo', size: 0.26, fill: '#FFFFFF', fontWeight: 900 },

    {
      type: 'rect', x: 0.37, y: 0.66, w: 0.07, h: 0.2, rx: 0.035, fill: '#4ADE80',
      shadow: { color: 'rgba(74,222,128,0.35)', blur: 0.04 }
    },
    { type: 'rect', x: 0.5, y: 0.66, w: 0.07, h: 0.3, rx: 0.035, fill: '#86EFAC' },
    { type: 'rect', x: 0.63, y: 0.66, w: 0.07, h: 0.14, rx: 0.035, fill: '#4ADE80', opacity: 0.8 },

    { type: 'rect', x: 0.5, y: 0.83, w: 0.38, h: 0.012, rx: 0.006, fill: '#A7F3D0', opacity: 0.5 },
    { type: 'text', x: 0.5, y: 0.89, text: 'TRACK', fontFamily: 'Cairo', size: 0.045, fill: '#A7F3D0', fontWeight: 800 }
  ]
};
