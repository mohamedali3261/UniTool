import { cinematicEffects } from "./cinematic/effects";
import { colorEffects } from "./color/effects";
import { motionEffects } from "./motion/effects";
import { lightEffects } from "./light/effects";
import { retroEffects } from "./retro/effects";
export const effects = [
  ...cinematicEffects,
  ...colorEffects,
  ...motionEffects,
  ...lightEffects,
  ...retroEffects,
];
export const effectById = new Map(effects.map((e) => [e.id, e]));
export const categories = [
  { id: "cinematic", name: "سينمائي", en: "CINEMA", color: "#b4a0ed" },
  { id: "color", name: "ألوان", en: "COLOR", color: "#a9e9bf" },
  { id: "motion", name: "حركة", en: "MOTION", color: "#aaceff" },
  { id: "light", name: "إضاءة", en: "LIGHT", color: "#f7cf91" },
  { id: "retro", name: "ريترو", en: "RETRO", color: "#e7a6b6" },
] as const;
export const filterPresets = effects
  .filter((e) => e.kind === "filter")
  .map((e) => ({ id: e.id, name: e.name, css: e.css || "" }));
