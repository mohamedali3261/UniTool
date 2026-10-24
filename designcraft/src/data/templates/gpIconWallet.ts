import type { DesignTemplate } from './types';

export const gpIconWallet: DesignTemplate = {
  id: 'gp-icon-wallet',
  cat: 'gp-icon',
  nameAr: 'أيقونة محفظة',
  nameEn: 'Wallet Icon',
  descAr: 'محفظة بيضاء على تدرج بنفسجي مع شعار EGP — 512×512',
  descEn: 'White wallet on a violet gradient with an EGP mark — 512×512',
  isNew: true,
  exactSize: true,
  bg: '#1E1B4B',
  bg2: '#4338CA',
  baseW: 512,
  baseH: 512,
  objects: [
    { type: 'circle', x: 0.82, y: 0.18, size: 0.42, fill: '#818CF8', opacity: 0.2 },
    { type: 'circle', x: 0.16, y: 0.84, size: 0.28, fill: '#22D3EE', opacity: 0.12 },

    {
      type: 'rect', x: 0.5, y: 0.54, w: 0.64, h: 0.42, rx: 0.08, fill: '#F8FAFC',
      shadow: { color: 'rgba(30,27,75,0.5)', blur: 0.06, offsetY: 0.02 }
    },
    { type: 'rect', x: 0.5, y: 0.38, w: 0.64, h: 0.08, rx: 0.04, fill: '#A5B4FC' },
    { type: 'circle', x: 0.7, y: 0.54, size: 0.1, fill: '#6366F1' },

    { type: 'text', x: 0.42, y: 0.56, text: 'EGP', fontFamily: 'Cairo', size: 0.08, fill: '#1E1B4B', fontWeight: 900 },
    { type: 'rect', x: 0.4, y: 0.65, w: 0.22, h: 0.012, rx: 0.006, fill: '#C7D2FE' }
  ]
};
