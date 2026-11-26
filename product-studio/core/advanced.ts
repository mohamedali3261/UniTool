import { validGradient, type Gradient } from "./materials";
import type { Layer } from "./model";
export interface Effects {
  gradient?: Gradient;
  italic?: boolean;
  align?: "left" | "center" | "right";
  lineHeight?: number;
  letterSpacing?: number;
  outlineOnly?: boolean;
  dashed?: boolean;
  flipX?: boolean;
  flipY?: boolean;
  lockRatio?: boolean;
  brightness?: number;
  contrast?: number;
  saturation?: number;
  hue?: number;
  outline?: number;
  outlineColor?: string;
  shadow?: number;
  curve?: number;
  crop?: { x: number; y: number; w: number; h: number };
}
export interface PrintArea {
  width: number;
  height: number;
  dpi: number;
  safe: number;
}
export interface StudioFont {
  name: string;
  data: string;
}
export const placements = [
  {
    id: "chest",
    ar: "منتصف الصدر",
    en: "Chest",
    x: 192,
    y: 240,
    w: 640,
    h: 400,
  },
  {
    id: "logo",
    ar: "شعار صغير",
    en: "Small logo",
    x: 610,
    y: 210,
    w: 200,
    h: 200,
  },
  {
    id: "back",
    ar: "أعلى الظهر",
    en: "Upper back",
    x: 212,
    y: 120,
    w: 600,
    h: 380,
  },
  {
    id: "sleeve",
    ar: "منتصف الكم",
    en: "Sleeve center",
    x: 262,
    y: 312,
    w: 500,
    h: 400,
  },
  {
    id: "bottom",
    ar: "أسفل التصميم",
    en: "Bottom",
    x: 212,
    y: 720,
    w: 600,
    h: 180,
  },
] as const;
export function snapPosition(
  item: Layer,
  x: number,
  y: number,
  others: Layer[],
  threshold = 12,
) {
  const axes = (axis: "x" | "y", size: "w" | "h", value: number) => {
    const anchors = [
      0,
      512,
      1024,
      ...others
        .filter((l) => l.id !== item.id && l.visible)
        .flatMap((l) => [l[axis], l[axis] + l[size] / 2, l[axis] + l[size]]),
    ];
    let best = threshold,
      position = value,
      guide: number | undefined;
    for (const a of anchors)
      for (const offset of [0, item[size] / 2, item[size]]) {
        const d = Math.abs(value + offset - a);
        if (d < best) {
          best = d;
          position = a - offset;
          guide = a;
        }
      }
    return { position: Math.round(position), guide };
  };
  const sx = axes("x", "w", x),
    sy = axes("y", "h", y);
  return { x: sx.position, y: sy.position, gx: sx.guide, gy: sy.guide };
}
export function printPixels(area: PrintArea) {
  return {
    width: Math.round((area.width / 2.54) * area.dpi),
    height: Math.round((area.height / 2.54) * area.dpi),
  };
}
export function effectiveDpi(
  pixels: number,
  itemWidth: number,
  area: PrintArea,
) {
  return pixels / (((itemWidth / 1024) * area.width) / 2.54);
}
const loadedFonts = new Map<string, Promise<void>>();
export async function loadStudioFonts(fonts: StudioFont[] = []) {
  for (const font of fonts) {
    let work = loadedFonts.get(font.name);
    if (!work) {
      work = (async () => {
        const face = new FontFace(font.name, `url(${font.data})`);
        await face.load();
        document.fonts.add(face);
      })();
      loadedFonts.set(font.name, work);
    }
    await work;
  }
}
export function validateEffects(l: Layer) {
  if (l.gradient !== undefined && !validGradient(l.gradient))
    throw Error("Invalid artwork gradient");
  if (l.align !== undefined && !["left", "center", "right"].includes(l.align))
    throw Error("Invalid alignment");
  for (const key of [
    "flipX",
    "flipY",
    "lockRatio",
    "italic",
    "outlineOnly",
    "dashed",
  ] as const)
    if (l[key] !== undefined && typeof l[key] !== "boolean")
      throw Error("Invalid transform");
  const ranges = {
    lineHeight: [0.7, 3],
    letterSpacing: [-5, 30],
    brightness: [0, 200],
    contrast: [0, 200],
    saturation: [0, 200],
    hue: [-180, 180],
    outline: [0, 30],
    shadow: [0, 60],
    curve: [-180, 180],
  };
  for (const [k, [min, max]] of Object.entries(ranges)) {
    const v = l[k as keyof Effects];
    if (
      v !== undefined &&
      (typeof v !== "number" || !Number.isFinite(v) || v < min || v > max)
    )
      throw Error("Invalid artwork effect");
  }
  if (l.outlineColor !== undefined && !/^#[\da-f]{6}$/i.test(l.outlineColor))
    throw Error("Invalid outline color");
  if (l.crop) {
    for (const k of ["x", "y", "w", "h"] as const)
      if (!Number.isFinite(l.crop[k]) || l.crop[k] < 0 || l.crop[k] > 1)
        throw Error("Invalid crop");
    if (
      l.crop.w <= 0 ||
      l.crop.h <= 0 ||
      l.crop.x + l.crop.w > 1.00001 ||
      l.crop.y + l.crop.h > 1.00001
    )
      throw Error("Invalid crop");
  }
}
