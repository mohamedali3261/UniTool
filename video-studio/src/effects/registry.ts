import { cinematicFilters } from "./cinematic/filters";
import { colorFilters } from "./color/filters";
import { retroFilters } from "./retro/filters";
import { natureEffects } from "./nature/effects";
import { geometryEffects } from "./geometry/effects";
import { opticsEffects } from "./optics/effects";
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
  ...cinematicFilters,
  ...colorFilters,
  ...retroFilters,
  ...natureEffects,
  ...geometryEffects,
  ...opticsEffects,
];
export const effectById = new Map(effects.map((e) => [e.id, e]));
export const categories = [
  { id: "cinematic", name: "سينمائي", en: "CINEMA", color: "#b4a0ed" },
  { id: "color", name: "ألوان", en: "COLOR", color: "#a9e9bf" },
  { id: "motion", name: "حركة", en: "MOTION", color: "#aaceff" },
  { id: "light", name: "إضاءة", en: "LIGHT", color: "#f7cf91" },
  { id: "retro", name: "ريترو", en: "RETRO", color: "#e7a6b6" },
  { id: "nature", name: "طبيعة وجسيمات", en: "NATURE", color: "#80dfb6" },
  { id: "geometry", name: "هندسي", en: "GEOMETRY", color: "#8fbaff" },
  { id: "optics", name: "عدسات وملمس", en: "OPTICS", color: "#ffc18f" },
] as const;
export const filterPresets = effects
  .filter((e) => e.kind === "filter")
  .map((e) => ({ id: e.id, name: e.name, css: e.css || "" }));
