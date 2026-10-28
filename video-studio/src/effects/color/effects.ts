import type { EffectDefinition } from "../types";
export const colorEffects: EffectDefinition[] = [
  {
    id: "original",
    name: "الأصلي",
    description: "ألوانك كما هي، بدون تعديل",
    css: "",
  },
  {
    id: "warm",
    name: "دفء",
    description: "دفء الشمس وبشرة طبيعية",
    css: "sepia(.35) saturate(1.3)",
  },
  {
    id: "mono",
    name: "أبيض وأسود",
    description: "تباين كلاسيكي بدون ألوان",
    css: "grayscale(1)",
  },
  {
    id: "vivid",
    name: "حيوي",
    description: "ألوان أغنى وحضور أقوى",
    css: "saturate(1.8) contrast(1.1)",
  },
  {
    id: "cool",
    name: "بارد",
    description: "درجات باردة وهادئة",
    css: "hue-rotate(20deg) saturate(.8)",
  },
  {
    id: "dream",
    name: "حالم",
    description: "ضوء ناعم وتباين هادئ",
    css: "brightness(1.15) contrast(.85) saturate(.8)",
  },
  {
    id: "rose",
    name: "روز",
    description: "درجات وردية خفيفة",
    css: "sepia(.2) hue-rotate(315deg) saturate(1.25)",
  },
  {
    id: "mint",
    name: "منت",
    description: "انتعاش أخضر بإضاءة ناعمة",
    css: "hue-rotate(25deg) brightness(1.06) saturate(.85)",
  },
  {
    id: "arctic",
    name: "جليدي",
    description: "برودة صافية وتباين نظيف",
    css: "hue-rotate(180deg) saturate(.55) contrast(1.1)",
  },
  {
    id: "golden",
    name: "الساعة الذهبية",
    description: "دفء ذهبي للحظات الغروب",
    css: "sepia(.45) saturate(1.5) brightness(1.08)",
  },
].map((e) => ({ ...e, category: "color", kind: "filter" }));
