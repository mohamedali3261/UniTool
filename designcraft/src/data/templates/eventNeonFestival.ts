import type { DesignTemplate } from './types';

export const eventNeonFestival: DesignTemplate = {
  id: 'event-neon-festival',
  cat: 'event',
  nameAr: 'بوستر مهرجان نيون',
  nameEn: 'Neon Festival Poster',
  descAr: 'بوستر حفلة ليلي بتوهج بنفسجي وعنوان متدرج وموعد بارز',
  descEn: 'Night gig poster with violet glow, gradient title and bold date pill',
  isNew: true,
  bg: '#0B0014',
  bg2: '#2E1065',
  baseW: 1080,
  baseH: 1350,
  objects: [
    { type: 'circle', x: 0.5, y: 0.34, size: 0.9, fill: '#7C3AED', opacity: 0.28 },
    { type: 'circle', x: 0.5, y: 0.34, size: 0.6, fill: '#A855F7', opacity: 0.18 },
    { type: 'circle', x: 0.5, y: 0.34, size: 0.42, fill: '#0B0014', opacity: 0.55 },

    { type: 'rect', x: 0.18, y: 0.2, w: 0.012, h: 0.012, fill: '#FDE047', rotation: 45 },
    { type: 'rect', x: 0.84, y: 0.62, w: 0.01, h: 0.01, fill: '#22D3EE', rotation: 45 },
    { type: 'rect', x: 0.22, y: 0.72, w: 0.009, h: 0.009, fill: '#EC4899', rotation: 45 },

    { type: 'text', x: 0.5, y: 0.1, text: 'LIVE MUSIC NIGHT', fontFamily: 'Montserrat', size: 0.022, fill: '#F0ABFC', fontWeight: 700 },

    {
      type: 'text', x: 0.5, y: 0.275, w: 0.8, text: 'ليلة\nالموسيقى', fontFamily: 'Cairo', size: 0.115,
      fill: '#FFFFFF', fill2: '#F0ABFC', fontWeight: 900,
      shadow: { color: 'rgba(168,85,247,0.5)', blur: 0.04 }
    },
    { type: 'rect', x: 0.5, y: 0.4, w: 0.14, h: 0.006, fill: '#F59E0B' },

    {
      type: 'rect', x: 0.5, y: 0.485, w: 0.44, h: 0.058, rx: 0.029,
      fill: '#F59E0B', fill2: '#EC4899',
      shadow: { color: 'rgba(245,158,11,0.4)', blur: 0.03 }
    },
    { type: 'text', x: 0.5, y: 0.485, text: 'الجمعة · 8 مساءً', fontFamily: 'Cairo', size: 0.031, fill: '#1F0713', fontWeight: 900 },

    { type: 'text', x: 0.5, y: 0.585, w: 0.75, text: 'دي جي سارة · فرقة النيل · مغامرات', fontFamily: 'Tajawal', size: 0.03, fill: '#E9D5FF' },

    { type: 'rect', x: 0.5, y: 0.715, w: 0.4, h: 0.066, rx: 0.033, fill: '#FFFFFF' },
    { type: 'text', x: 0.5, y: 0.715, text: 'احجز تذكرتك', fontFamily: 'Cairo', size: 0.033, fill: '#4C1D95', fontWeight: 900 },

    { type: 'text', x: 0.5, y: 0.81, text: 'المسرح الكبير · الدخول 18+', fontFamily: 'Tajawal', size: 0.024, fill: '#C4B5FD' },

    { type: 'rect', x: 0.5, y: 0.945, w: 0.88, h: 0.0035, fill: '#FFFFFF', opacity: 0.15 }
  ]
};
