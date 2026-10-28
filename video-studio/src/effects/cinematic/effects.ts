import type { EffectDefinition } from "../types";
export const cinematicEffects: EffectDefinition[] = [
  {
    id: "cinema",
    name: "سينمائي",
    description: "تباين غني وتشبع محسوب",
    css: "contrast(1.2) saturate(.75)",
  },
  {
    id: "teal-amber",
    name: "تيل وأمبر",
    description: "مزاج دافئ مستوحى من السينما",
    css: "sepia(.25) hue-rotate(345deg) contrast(1.2) saturate(1.2)",
  },
  {
    id: "matte",
    name: "مات",
    description: "ظلال ناعمة وملمس هادئ",
    css: "contrast(.82) brightness(1.1) saturate(.75)",
  },
  {
    id: "noir",
    name: "نوار",
    description: "دراما أحادية عالية التباين",
    css: "grayscale(1) contrast(1.55) brightness(.9)",
  },
  {
    id: "dusk",
    name: "آخر ضوء",
    description: "مزاج غروب منخفض الإضاءة",
    css: "sepia(.3) contrast(1.15) brightness(.85) saturate(1.25)",
  },
  {
    id: "emerald",
    name: "إميرالد",
    description: "درجات زمردية للمناظر الطبيعية",
    css: "hue-rotate(30deg) contrast(1.16) saturate(1.25)",
  },
].map((e) => ({ ...e, category: "cinematic", kind: "filter" }));
