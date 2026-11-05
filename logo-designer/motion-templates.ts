import { templates, templateProject, type Template } from "./templates";
import { motionPresets, type MotionPreset } from "./motion";
import { sequenceTracks, setTrack } from "./motion-tracks";
import type { Project } from "./types";
export const motionIndustries = [
  ["all", "كل المجالات", "All industries"],
  ["general", "عام", "General"],
  ["food", "مطاعم", "Restaurants"],
  ["cafe", "كافيهات", "Cafés"],
  ["tech", "تقنية", "Technology"],
  ["estate", "عقارات", "Real estate"],
  ["fashion", "ملابس", "Fashion"],
  ["personal", "علامة شخصية", "Personal brand"],
] as const;
export type MotionTemplate = {
  id: string;
  ar: string;
  en: string;
  preset: MotionPreset;
  sector: string;
  template: Template;
  brandAr: string;
  brandEn: string;
  colors?: string[];
};
const classic: MotionTemplate[] = motionPresets.map((preset, i) => ({
  ...preset,
  preset: preset.id,
  sector: "general",
  template: templates[[3, 17, 29, 46, 60, 77][i]],
  brandAr: ["نواة", "مدار", "لمعة", "أفق", "ستوديو", "نسيم"][i],
  brandEn: ["NEXA", "ORBIT", "SPARK", "HORIZON", "STUDIO", "BREEZE"][i],
}));
const sectors = [
  {
    id: "food",
    ar: "مذاق",
    en: "TASTE",
    icon: "Utensils",
    indices: [6, 66, 25],
    colors: ["#702b21", "#dd884a", "#fff4e6"],
  },
  {
    id: "cafe",
    ar: "بنّ",
    en: "BUNN",
    icon: "Coffee",
    indices: [7, 70, 48],
    colors: ["#3c2921", "#b58a57", "#fbf3e5"],
  },
  {
    id: "tech",
    ar: "نقطة",
    en: "DOT",
    icon: "Cpu",
    indices: [3, 75, 40],
    colors: ["#153839", "#269b8b", "#effaf7"],
  },
  {
    id: "estate",
    ar: "رُكن",
    en: "RUKN",
    icon: "Building2",
    indices: [9, 65, 50],
    colors: ["#273e39", "#b39352", "#f5f3e9"],
  },
  {
    id: "fashion",
    ar: "خيط",
    en: "THREAD",
    icon: "Shirt",
    indices: [12, 77, 55],
    colors: ["#30272c", "#ac6d82", "#fcf3f5"],
  },
  {
    id: "personal",
    ar: "أثر",
    en: "SIGNATURE",
    icon: "PenTool",
    indices: [33, 79, 59],
    colors: ["#292b3b", "#8c744e", "#faf7ed"],
  },
];
export const motionTemplates: MotionTemplate[] = [
  ...classic,
  ...sectors.flatMap((s, i) =>
    s.indices.map((index, j) => ({
      id: `motion-${s.id}-${j}`,
      ar: `${s.ar} / 0${j + 1}`,
      en: `${s.en} / 0${j + 1}`,
      preset: motionPresets[(i + j) % motionPresets.length].id,
      sector: s.id,
      template: { ...templates[index], icon: s.icon },
      brandAr: s.ar,
      brandEn: s.en,
      colors: s.colors,
    })),
  ),
];
export function motionTemplateProject(
  id: string,
  lang: "ar" | "en",
  brand?: string,
): Project {
  const t = motionTemplates.find((t) => t.id === id);
  if (!t) throw Error("Unknown motion template");
  let p: Project = {
    ...templateProject(
      t.template,
      lang,
      brand?.trim() || (lang === "ar" ? t.brandAr : t.brandEn),
      t.colors,
    ),
    motion: { preset: t.preset, duration: 3 },
  };
  if (t.sector !== "general") {
    p = sequenceTracks(p);
    p.nodes
      .filter((n) => !n.hidden)
      .forEach((n) => {
        p = setTrack(p, n.id, {
          enter:
            n.kind === "text"
              ? t.sector === "personal"
                ? "type"
                : "fade"
              : ["shape", "icon", "vector"].includes(n.kind)
                ? "draw"
                : "pop",
          hold: n.kind === "icon" ? "shine" : "none",
        });
      });
  }
  return p;
}
