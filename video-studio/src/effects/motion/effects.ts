import type { EffectDefinition } from "../types";
export const motionEffects: EffectDefinition[] = [
  {
    id: "push-in",
    name: "اقتراب هادي",
    description: "حركة كاميرا ناعمة للأمام",
    category: "motion",
    kind: "effect",
    camera: ({ progress, amount }) => ({ zoom: 1 + progress * 0.22 * amount }),
  },
  {
    id: "pull-out",
    name: "ابتعاد",
    description: "اكشف حكاية المشهد تدريجيًا",
    category: "motion",
    kind: "effect",
    camera: ({ progress, amount }) => ({
      zoom: 1 + (1 - progress) * 0.22 * amount,
    }),
  },
  {
    id: "pan-left",
    name: "بان يسار",
    description: "رحلة أفقية ناعمة داخل الكادر",
    category: "motion",
    kind: "effect",
    camera: ({ progress, amount, w }) => ({
      zoom: 1 + 0.18 * amount,
      x: (0.5 - progress) * w * 0.12 * amount,
    }),
  },
  {
    id: "pan-right",
    name: "بان يمين",
    description: "حركة أفقية للاتجاه المقابل",
    category: "motion",
    kind: "effect",
    camera: ({ progress, amount, w }) => ({
      zoom: 1 + 0.18 * amount,
      x: (progress - 0.5) * w * 0.12 * amount,
    }),
  },
  {
    id: "float",
    name: "طفو",
    description: "إيقاع هادئ، كأن الكاميرا بتتنفس",
    category: "motion",
    kind: "effect",
    camera: ({ t, amount, w, h }) => ({
      zoom: 1 + 0.1 * amount,
      x: Math.sin(t * 0.85) * w * 0.02 * amount,
      y: Math.cos(t * 0.7) * h * 0.02 * amount,
    }),
  },
  {
    id: "pulse",
    name: "نبض",
    description: "نبضة تقريب دورية بدون وميض",
    category: "motion",
    kind: "effect",
    camera: ({ t, amount }) => ({
      zoom: 1 + (0.5 + 0.5 * Math.sin(t * 3)) * 0.09 * amount,
    }),
  },
  {
    id: "handheld",
    name: "كاميرا حرة",
    description: "اهتزاز خفيف بروح التصوير اليدوي",
    category: "motion",
    kind: "effect",
    camera: ({ t, amount, w, h }) => ({
      zoom: 1 + 0.06 * amount,
      x: Math.sin(t * 7) * w * 0.006 * amount,
      y: Math.sin(t * 5.3) * h * 0.008 * amount,
      rotate: Math.sin(t * 4) * 0.007 * amount,
    }),
  },
];
