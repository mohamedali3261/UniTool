import type { DesignTemplate } from './types';

export const socialMinimalCoffee: DesignTemplate = {
  id: 'social-minimal-coffee',
  cat: 'social',
  nameAr: 'قهوة الصباح',
  nameEn: 'Minimal Coffee',
  descAr: 'منشور مينيمال دافئ بلون كريمي وفنجان قهوة مرسوم بالدوائر',
  descEn: 'Warm minimal post with a cream palette and a circle-built coffee cup',
  isNew: true,
  bg: '#F6EFE5',
  bg2: '#E8D6C3',
  baseW: 1080,
  baseH: 1080,
  objects: [
    { type: 'rect', x: 0.5, y: 0.045, w: 0.86, h: 0.0025, fill: '#6F4E37', opacity: 0.3 },
    { type: 'rect', x: 0.5, y: 0.955, w: 0.86, h: 0.0025, fill: '#6F4E37', opacity: 0.3 },

    { type: 'circle', x: 0.5, y: 0.47, size: 0.52, fill: '#EADBC8' },
    { type: 'circle', x: 0.5, y: 0.41, size: 0.4, fill: '#6F4E37', fill2: '#3B2416' },
    { type: 'circle', x: 0.5, y: 0.41, size: 0.335, fill: '#C08B5C' },
    { type: 'circle', x: 0.5, y: 0.41, size: 0.285, fill: '#5A3A22', opacity: 0.6 },
    { type: 'circle', x: 0.63, y: 0.4, size: 0.095, fill: '#F6EFE5', opacity: 0.2 },
    { type: 'circle', x: 0.39, y: 0.44, size: 0.05, fill: '#F6EFE5', opacity: 0.12 },

    { type: 'text', x: 0.5, y: 0.085, text: 'SLOW MORNINGS', fontFamily: 'Montserrat', size: 0.022, fill: '#6F4E37', fontWeight: 700 },

    { type: 'text', x: 0.5, y: 0.73, text: 'قهوة الصباح', fontFamily: 'Amiri', size: 0.1, fill: '#3B2416', fontWeight: 700 },
    { type: 'rect', x: 0.5, y: 0.795, w: 0.1, h: 0.003, fill: '#6F4E37', opacity: 0.55 },
    { type: 'text', x: 0.5, y: 0.845, w: 0.8, text: 'محمّصة طازجة كل يوم · حبوب مختارة بعناية', fontFamily: 'Tajawal', size: 0.032, fill: '#6F4E37' },

    { type: 'text', x: 0.5, y: 0.925, text: 'COFFEE & CO.', fontFamily: 'Montserrat', size: 0.018, fill: '#8A6A52', fontWeight: 600 }
  ]
};
