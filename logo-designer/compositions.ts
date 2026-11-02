import { node, uid, type Element } from "./types";
/** تكوينات متعددة الطبقات: لا تسطيح ولا دمج دائم للمسارات، وكل إضافة مجموعة جديدة مستقلة. */
export type Composition = {
  id: string;
  ar: string;
  en: string;
  parts: Partial<Element>[];
};
const icon = (
  asset: string,
  x: number,
  y: number,
  w: number,
  h = w,
): Partial<Element> => ({
  kind: "icon",
  asset,
  name: asset,
  x,
  y,
  w,
  h,
  fill: "#235c4c",
  strokeWidth: 2,
});
const shape = (
  asset: string,
  x: number,
  y: number,
  w: number,
  h = w,
): Partial<Element> => ({ asset, name: asset, x, y, w, h, fill: "#91c8a0" });
const letter: Partial<Element> = {
  kind: "text",
  text: "M",
  name: "Your initial",
  font: "cairo",
  fontSize: 62,
  weight: 700,
  x: 100,
  y: 108,
  w: 90,
  h: 85,
  fill: "#235c4c",
};
export const compositions: Composition[] = [
  {
    id: "pencil-bulb",
    ar: "قلم ولمبة",
    en: "Pencil & bulb",
    parts: [
      icon("Lightbulb", 100, 76, 105),
      { ...icon("Pencil", 100, 143, 58), rotation: -45 },
      shape("star", 151, 41, 20),
    ],
  },
  {
    id: "leaf-drops",
    ar: "ورقة وقطرات",
    en: "Leaf & drops",
    parts: [
      icon("Leaf", 100, 92, 130),
      { ...icon("Droplets", 137, 145, 55), fill: "#719cce" },
      shape("circle", 53, 131, 14),
    ],
  },
  {
    id: "house-key",
    ar: "بيت ومفتاح",
    en: "House & key",
    parts: [
      icon("House", 100, 90, 140),
      { ...icon("Key", 100, 121, 64), fill: "#b37a38" },
      shape("circle", 100, 169, 10),
    ],
  },
  {
    id: "book-wings",
    ar: "كتاب وجناحين",
    en: "Book & wings",
    parts: [
      { ...icon("Feather", 49, 79, 70), rotation: -35 },
      { ...icon("Feather", 151, 79, 70), rotation: 35, flipX: true },
      icon("BookOpen", 100, 123, 112),
    ],
  },
  {
    id: "coffee-sun",
    ar: "قهوة وشمس",
    en: "Coffee & sun",
    parts: [
      { ...icon("Sun", 87, 55, 67), fill: "#c08b38" },
      icon("Coffee", 100, 119, 113),
      { ...shape("square", 91, 165, 100, 5), radius: 2 },
    ],
  },
  {
    id: "shield-initial",
    ar: "درع وحرفك",
    en: "Shield & initial",
    parts: [
      shape("shield", 100, 100, 150, 170),
      { ...icon("Shield", 100, 97, 126, 145), fill: "#235c4c" },
      { ...letter },
    ],
  },
  {
    id: "eye-lens",
    ar: "عين وعدسة",
    en: "Eye & lens",
    parts: [
      icon("Focus", 100, 100, 163),
      icon("Aperture", 100, 100, 88),
      shape("circle", 100, 100, 17),
    ],
  },
  {
    id: "arrow-initial",
    ar: "حرف وسهم",
    en: "Initial & arrow",
    parts: [
      { ...shape("ring", 100, 100, 155), strokeWidth: 3 },
      { ...letter, x: 85, w: 100 },
      { ...icon("Navigation", 139, 78, 51), rotation: 40, fill: "#b37a38" },
    ],
  },
  {
    id: "mountain-compass",
    ar: "جبال وبوصلة",
    en: "Mountain & compass",
    parts: [
      icon("Compass", 100, 100, 166),
      { ...shape("circle", 100, 106, 107), fill: "#f4e9cd" },
      icon("Mountain", 100, 111, 88),
    ],
  },
  {
    id: "heart-sprout",
    ar: "قلب ونبتة",
    en: "Heart & sprout",
    parts: [
      icon("Heart", 100, 122, 138),
      icon("Sprout", 100, 65, 73),
      { ...shape("circle", 100, 124, 15), fill: "#bd715d" },
    ],
  },
  {
    id: "orbit-spark",
    ar: "مدار وشرارة",
    en: "Orbit & spark",
    parts: [
      { ...icon("Orbit", 100, 100, 163), fill: "#6d67a8" },
      icon("Zap", 100, 100, 65),
      shape("star", 157, 51, 24),
    ],
  },
  {
    id: "crown-gem",
    ar: "تاج وماسة",
    en: "Crown & gem",
    parts: [
      { ...icon("Crown", 100, 57, 83), fill: "#b37a38" },
      icon("Gem", 100, 125, 100),
      { ...shape("square", 100, 177, 97, 4), fill: "#b37a38" },
    ],
  },
];
export function compositionNodes(
  c: Composition,
  options: {
    x: number;
    y: number;
    size: number;
    primary?: string;
    accent?: string;
    initial?: string;
    grouped?: boolean;
  },
): Element[] {
  const group = options.grouped === false ? undefined : uid(),
    scale = options.size / 200;
  return c.parts.map((part, i) =>
    node({
      ...structuredClone(part),
      id: uid(),
      group,
      x: options.x + ((part.x ?? 100) - 100) * scale,
      y: options.y + ((part.y ?? 100) - 100) * scale,
      w: (part.w ?? 60) * scale,
      h: (part.h ?? 60) * scale,
      fontSize: (part.fontSize ?? 52) * scale,
      name: part.name || `${c.en} ${i + 1}`,
      fill:
        part.fill === "#235c4c"
          ? options.primary || part.fill
          : options.accent || part.fill,
      ...(part.kind === "text" ? { text: options.initial?.trim() || "M" } : {}),
    }),
  );
}
