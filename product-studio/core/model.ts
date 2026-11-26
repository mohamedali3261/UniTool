import { teeStyles } from "./teeStyles";
import { fabricTypes, validGradient } from "./materials";
import type { DisplayUnit } from "./measurements";
import { validateGlb, glbBuffer } from "./glb";
import {
  validateEffects,
  type Effects,
  type PrintArea,
  type StudioFont,
} from "./advanced";
import { defaultTryOn, validateTryOn, type TryOnSettings } from "./tryOn";
import { defaultAppearance, type Appearance } from "./fabric";
export const printParts = [
  "front",
  "back",
  "leftSleeve",
  "rightSleeve",
  "hoodLeft",
  "hoodRight",
] as const;
export type Side = (typeof printParts)[number];
export const partNames: Record<Side, { ar: string; en: string }> = {
  front: { ar: "الوجه الأمامي", en: "Front side" },
  back: { ar: "الوجه الخلفي", en: "Back side" },
  leftSleeve: { ar: "الكم الأيسر", en: "Left sleeve" },
  rightSleeve: { ar: "الكم الأيمن", en: "Right sleeve" },
  hoodLeft: { ar: "الكابيشون الأيسر", en: "Left hood" },
  hoodRight: { ar: "الكابيشون الأيمن", en: "Right hood" },
};
export type Product = "tee" | "hoodie" | "tote" | "sweatshirt";
export interface Layer extends Effects {
  id: string;
  kind: "text" | "image" | "shape";
  name: string;
  text: string;
  src: string;
  shape: "circle" | "rect" | "star" | "triangle" | "diamond" | "line";
  x: number;
  y: number;
  w: number;
  h: number;
  rotation: number;
  color: string;
  font: string;
  bold: boolean;
  opacity: number;
  visible: boolean;
  locked: boolean;
}
export interface Project {
  fonts?: StudioFont[];
  printAreas?: Partial<Record<Side, PrintArea>>;
  customModel?: string;
  displayUnit?: DisplayUnit;
  version: 1;
  name: string;
  product: Product;
  color: string;
  background: string;
  sides: Record<Side, Layer[]>;
  appearance: Appearance;
  tryOn: TryOnSettings;
}
export const products: {
  id: Product;
  ar: string;
  en: string;
  label: string;
}[] = [
  { id: "tee", ar: "تيشيرت كلاسيك", en: "Classic T-shirt", label: "01" },
  { id: "hoodie", ar: "هودي", en: "Pullover hoodie", label: "02" },
  { id: "tote", ar: "حقيبة قماش", en: "Canvas tote", label: "03" },
  { id: "sweatshirt", ar: "سويت شيرت", en: "Sweatshirt", label: "04" },
];
let sequence = 0;
export function layer(kind: Layer["kind"], patch: Partial<Layer> = {}): Layer {
  return {
    id: `layer-${Date.now()}-${++sequence}`,
    kind,
    name: kind === "text" ? "نص جديد" : kind === "image" ? "صورة" : "شكل",
    text: "MAKE\nIT YOURS.",
    src: "",
    shape: "circle",
    x: 128,
    y: 160,
    w: 768,
    h: 420,
    rotation: 0,
    color: "#ea603c",
    font: "Arial",
    bold: true,
    opacity: 1,
    visible: true,
    locked: false,
    ...patch,
  };
}
export function initialProject(): Project {
  return {
    version: 1,
    displayUnit: "mm",
    name: "STUDIO / 001",
    product: "tee",
    color: "#496c50",
    background: "#173e32",
    appearance: { ...defaultAppearance },
    tryOn: defaultTryOn(),
    sides: {
      front: [
        layer("text", {
          name: "MAKE IT YOURS",
          text: "MAKE\nIT YOURS.",
          y: 220,
          color: "#f2efe5",
        }),
        layer("text", {
          name: "Independent edition",
          text: "INDEPENDENT GOODS — EST. 2026",
          x: 100,
          y: 690,
          w: 824,
          h: 55,
          color: "#dae3d4",
          bold: false,
        }),
      ],
      back: [],
      leftSleeve: [],
      rightSleeve: [],
      hoodLeft: [],
      hoodRight: [],
    },
  };
}
export function updateLayer(
  p: Project,
  side: Side,
  id: string,
  patch: Partial<Layer>,
): Project {
  const existing = p.sides[side].find((l) => l.id === id);
  if (
    !existing ||
    Object.entries(patch).every(([k, v]) => existing[k as keyof Layer] === v)
  )
    return p;
  return {
    ...p,
    sides: {
      ...p.sides,
      [side]: p.sides[side].map((l) =>
        l.id === id ? { ...l, ...patch, id: l.id } : l,
      ),
    },
  };
}
export function reorder(
  p: Project,
  side: Side,
  id: string,
  delta: number,
): Project {
  const list = [...p.sides[side]],
    i = list.findIndex((l) => l.id === id),
    j = i + delta;
  if (i < 0 || j < 0 || j >= list.length) return p;
  [list[i], list[j]] = [list[j], list[i]];
  return { ...p, sides: { ...p.sides, [side]: list } };
}
const color = /^#[0-9a-f]{6}$/i;
export function parseProject(text: string): Project {
  const p = JSON.parse(text);
  if (
    p?.version !== 1 ||
    !products.some((item) => item.id === p.product) ||
    typeof p.name !== "string" ||
    !color.test(p.color) ||
    !color.test(p.background)
  )
    throw new Error("ملف مشروع غير صالح");
  p.displayUnit ??= "mm";
  if (!["mm", "cm", "in"].includes(p.displayUnit))
    throw Error("Invalid measurement unit");
  p.tryOn ??= defaultTryOn();
  // Retired stock model: migrate old projects, without retaining the removed photo.
  if (p.tryOn.source === "woman") p.tryOn = defaultTryOn();
  if (!validateTryOn(p.tryOn)) throw new Error("إعدادات تلبيس غير صالحة");
  p.appearance ??= { ...defaultAppearance };
  for (const key of [
    "wrinkles",
    "texture",
    "roughness",
    "lightPower",
    "lightAngle",
  ]) {
    const n = p.appearance[key];
    const limits: Record<string, number[]> = {
      wrinkles: [0, 1],
      texture: [0, 1],
      roughness: [0.2, 1],
      lightPower: [0.5, 5],
      lightAngle: [-180, 180],
    };
    if (!Number.isFinite(n) || n < limits[key][0] || n > limits[key][1])
      throw new Error("إعدادات خامة غير صالحة");
  }
  p.appearance.previewQuality ??= "auto";
  if (
    !["auto", "full", "half", "quarter"].includes(p.appearance.previewQuality)
  )
    throw Error("Invalid preview quality");
  p.appearance.material ??= "cotton";
  p.appearance.knitSize ??= 1;
  p.appearance.brightness ??= 1;
  if (
    !fabricTypes.some((m) => m.id === p.appearance.material) ||
    !Number.isFinite(p.appearance.knitSize) ||
    p.appearance.knitSize < 0.25 ||
    p.appearance.knitSize > 4 ||
    !Number.isFinite(p.appearance.brightness) ||
    p.appearance.brightness < 0.5 ||
    p.appearance.brightness > 1.5 ||
    (p.appearance.gradient !== undefined &&
      !validGradient(p.appearance.gradient))
  )
    throw Error("Invalid fabric settings");
  if (
    p.appearance.teeStyle !== undefined &&
    !teeStyles.some((s) => s.id === p.appearance.teeStyle)
  )
    throw Error("Invalid T-shirt style");
  p.appearance.hanger ??= false;
  p.appearance.backdrop ??= "studio";
  if (
    typeof p.appearance.hanger !== "boolean" ||
    !["studio", "solid", "window", "blinds", "beam", "arch"].includes(
      p.appearance.backdrop,
    )
  )
    throw new Error("إعدادات مشهد غير صالحة");
  p.appearance.hanger = false;
  p.appearance.fit ??= "regular";
  if (!["regular", "oversized"].includes(p.appearance.fit))
    throw new Error("قصة غير صالحة");
  if (!["relaxed", "pockets"].includes(p.appearance.pose))
    throw new Error("وضعية غير صالحة");
  for (const part of printParts)
    if (!["front", "back"].includes(part) && p.sides && !p.sides[part])
      p.sides[part] = [];
  if (
    p.fonts !== undefined &&
    (!Array.isArray(p.fonts) ||
      p.fonts.length > 10 ||
      p.fonts.some(
        (f: any) =>
          !/^StudioFont[0-9]+$/.test(f.name) ||
          typeof f.data !== "string" ||
          f.data.length > 3000000 ||
          !/^data:(font\/(woff2?|ttf|otf)|application\/(font-woff|octet-stream|x-font-ttf));base64,/.test(
            f.data,
          ),
      ))
  )
    throw Error("Invalid embedded fonts");
  if (
    p.customModel !== undefined &&
    (typeof p.customModel !== "string" ||
      p.customModel.length > 28000000 ||
      !/^data:model\/gltf-binary;base64,/.test(p.customModel))
  )
    throw Error("Invalid GLB");
  if (p.customModel) validateGlb(glbBuffer(p.customModel));
  if (p.printAreas)
    for (const [key, a] of Object.entries(p.printAreas) as [
      string,
      PrintArea,
    ][]) {
      if (
        !printParts.includes(key as Side) ||
        !a ||
        ![a.width, a.height, a.dpi, a.safe].every(Number.isFinite) ||
        a.width < 1 ||
        a.width > 100 ||
        a.height < 1 ||
        a.height > 100 ||
        a.dpi < 72 ||
        a.dpi > 600 ||
        a.safe < 0 ||
        a.safe > 20 ||
        a.safe >= Math.min(a.width, a.height) / 2
      )
        throw Error("Invalid print area");
    }
  for (const side of printParts) {
    if (!Array.isArray(p.sides?.[side]) || p.sides[side].length > 100)
      throw new Error("عدد طبقات غير صالح");
    const ids = new Set();
    for (const l of p.sides[side]) {
      if (
        !l ||
        typeof l.id !== "string" ||
        ids.has(l.id) ||
        !["text", "image", "shape"].includes(l.kind) ||
        !["circle", "rect", "star", "triangle", "diamond", "line"].includes(
          l.shape,
        ) ||
        !color.test(l.color) ||
        ![
          "Arial",
          "Georgia",
          "monospace",
          "Tahoma",
          ...(p.fonts ?? []).map((f: StudioFont) => f.name),
        ].includes(l.font)
      )
        throw new Error("طبقة غير صالحة");
      validateEffects(l);
      ids.add(l.id);
      for (const k of ["name", "text", "src"])
        if (
          typeof l[k] !== "string" ||
          l[k].length > (k === "src" ? 15000000 : 5000)
        )
          throw new Error("بيانات غير صالحة");
      if (l.src && !/^data:image\/(png|jpeg|webp);base64,/.test(l.src))
        throw new Error("الصورة يجب أن تكون مضمّنة");
      for (const k of ["x", "y", "w", "h", "rotation", "opacity"])
        if (!Number.isFinite(l[k]) || Math.abs(l[k]) > 10000)
          throw new Error("مقاسات غير صالحة");
      if (
        l.w < 1 ||
        l.h < 1 ||
        l.opacity < 0 ||
        l.opacity > 1 ||
        ["visible", "locked", "bold"].some((k) => typeof l[k] !== "boolean")
      )
        throw new Error("خصائص غير صالحة");
    }
  }
  return p;
}
