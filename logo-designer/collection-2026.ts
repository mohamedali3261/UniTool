import { node, type Project } from "./types";
import type { Template } from "./templates";
/** عشرون قالبًا في خمس عائلات جديدة، مع جميع الأجزاء قابلة للتحرير. */
export const latestLayouts = [
  ["archway", "أقواس", "Archway"],
  ["mosaic", "فسيفساء", "Mosaic"],
  ["capsule", "كبسولة", "Capsule"],
  ["beacon", "منارة", "Beacon"],
  ["signature", "توقيع", "Signature"],
] as const;
const briefs = [
  ["brand", "دار", "DAR", "Armchair"],
  ["nature", "غيث", "RAIN", "CloudRain"],
  ["travel", "مرفأ", "HARBOR", "LifeBuoy"],
  ["education", "مدى", "SCOPE", "Telescope"],
  ["creative", "طيّ", "FOLD", "Origami"],
  ["industry", "بنيان", "BRICK", "BrickWall"],
  ["food", "مذاق", "TASTE", "Dessert"],
  ["sport", "إيقاع", "PACE", "Timer"],
  ["health", "رعاية", "CARE", "HandHeart"],
  ["finance", "أمان", "VAULT", "Vault"],
  ["brand", "دفء", "WARM", "LampDesk"],
  ["food", "خُضرة", "GREENS", "Vegan"],
  ["travel", "وجهة", "DESTINATION", "Signpost"],
  ["nature", "شروق", "DAWN", "Sunrise"],
  ["industry", "صنعة", "CRAFT", "Ruler"],
  ["tech", "تواصل", "CONNECT", "Mail"],
  ["creative", "وتر", "CHORD", "Guitar"],
  ["brand", "خيط", "THREAD", "Spool"],
  ["food", "سكوب", "SCOOP", "IceCreamBowl"],
  ["education", "معرفة", "KNOW", "University"],
] as const;
export const latestTemplates: Template[] = briefs.map(
  ([category, ar, en, icon], i) => ({
    id: "edition-" + i,
    category,
    ar,
    en,
    icon,
    font: ["cairo", "montserrat", "tajawal", "playfair-display", "amiri"][
      Math.floor(i / 4)
    ],
    palette: (i + 3) % 8,
    layout: latestLayouts[Math.floor(i / 4)][0],
  }),
);
export function composeLatest(
  p: Project,
  t: Template,
  title: string,
  c: string[],
  lang: "ar" | "en",
) {
  const [ink, accent, paper] = c;
  p.background = paper;
  const add = (v: Parameters<typeof node>[0]) => p.nodes.push(node(v));
  const shape = (
    asset: string,
    x: number,
    y: number,
    w: number,
    h: number,
    fill = ink,
    rotation = 0,
  ) =>
    add({
      asset,
      name: asset,
      x,
      y,
      w,
      h,
      fill,
      rotation,
      radius: asset === "square" ? Math.min(w, h) / 2 : 20,
    });
  const type = (
    value: string,
    x: number,
    y: number,
    size: number,
    fill = ink,
    w = 540,
  ) =>
    add({
      kind: "text",
      name: value,
      text: value,
      font: t.font,
      x,
      y,
      w,
      h: size * 1.6,
      fontSize: Math.max(
        8,
        Math.min(size, w / Math.max(1, [...value].length * 0.72)),
      ),
      fill,
      weight: 400,
      spacing: lang === "en" ? 1 : 0,
    });
  const icon = (x: number, y: number, size: number, fill = ink) =>
    add({
      kind: "icon",
      name: t.icon,
      asset: t.icon,
      x,
      y,
      w: size,
      h: size,
      fill,
      strokeWidth: 1.7,
    });
  const tagline =
    lang === "ar" ? "حكاية تبدأ بتفصيلة" : "THOUGHTFULLY DIFFERENT";
  switch (t.layout) {
    case "archway":
      shape("arch", 400, 255, 230, 280, accent);
      shape("arch", 400, 260, 186, 244, paper);
      icon(400, 260, 100);
      type(title, 400, 430, 58);
      type(tagline, 400, 492, 17);
      shape("circle", 257, 394, 12, 12);
      shape("circle", 543, 394, 12, 12);
      break;
    case "mosaic":
      for (const [i, [x, y]] of [
        [350, 195],
        [450, 195],
        [350, 295],
        [450, 295],
      ].entries())
        shape(
          i % 2 ? "circle" : "square",
          x,
          y,
          88,
          88,
          i % 2 ? accent : ink,
          i * 15,
        );
      icon(400, 245, 68, paper);
      type(title, 400, 412, 60);
      type(tagline, 400, 474, 17);
      break;
    case "capsule":
      p.background = ink;
      shape("square", 400, 250, 340, 170, accent);
      icon(315, 250, 90, ink);
      shape("square", 386, 250, 3, 90, ink);
      type(title, 480, 253, 42, ink, 150);
      type(tagline, 400, 402, 19, paper);
      shape("ring", 400, 250, 390, 222, accent);
      break;
    case "beacon":
      shape("triangle", 400, 230, 300, 285, accent);
      shape("triangle", 400, 245, 220, 208, paper);
      icon(400, 253, 92);
      type(title, 400, 415, 57);
      type(tagline, 400, 480, 17);
      for (const [x, y, r] of [
        [259, 133, -30],
        [400, 93, 0],
        [541, 133, 30],
      ])
        shape("square", x, y, 4, 32, ink, r);
      break;
    case "signature":
      p.background = ink;
      icon(235, 235, 90, accent);
      type(title, 450, 300, 78, paper, 480);
      shape("wave", 440, 373, 365, 19, accent);
      type(tagline, 440, 440, 17, accent);
      type(lang === "ar" ? "صُنع بشغف" : "MADE WITH SOUL", 440, 487, 12, paper);
      shape("star", 650, 200, 26, 26, accent);
      break;
  }
  return p;
}
