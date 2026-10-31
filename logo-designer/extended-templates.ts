import { node, type Project } from "./types";
import { vectorMarks, vectorNode } from "./vector-library";
import type { Template } from "./templates";
/** ست عائلات تكوين مختلفة؛ كل إطار وزخرفة وحرف طبقة مستقلة. */
export const newLayouts = [
  "seal",
  "monogram",
  "editorial",
  "crest",
  "split",
  "orbital",
] as const;
const briefs = [
  ["health", "نبض", "PULSE", "HeartPulse", "pulse-cross"],
  ["education", "أفق", "HORIZON", "School", "open-book"],
  ["travel", "رحلة", "ROAM", "Tent", "north-arrow"],
  ["finance", "نمو", "GROW", "ChartNoAxesCombined", "rising-peaks"],
  ["brand", "هالة", "HALO", "Gem", "rosette-8"],
  ["food", "رغيف", "LOAF", "Croissant", "bread"],
  ["creative", "صوت", "ECHO", "Mic", "pixel-spark"],
  ["nature", "ندى", "DEW", "Droplets", "droplet-cut"],
  ["estate", "واجهات", "FACET", "Building2", "skyline"],
  ["food", "حصاد", "HARVEST", "Wheat", "double-leaf"],
  ["creative", "مشهد", "FRAME", "Clapperboard", "woven"],
  ["brand", "لمسة", "TOUCH", "Flower2", "petal-four"],
  ["sport", "وثبة", "LEAP", "Trophy", "chevrons"],
  ["animals", "رفيق", "COMPANION", "PawPrint", "wing-abstract"],
  ["education", "بيان", "BAYAN", "Library", "open-book"],
  ["industry", "صُنع", "FORGE", "Factory", "ribbon-n"],
  ["tech", "وصل", "LINK", "Cpu", "infinity-cut"],
  ["travel", "دروب", "TRAIL", "Map", "rising-peaks"],
  ["health", "عافية", "WELL", "Hospital", "pulse-cross"],
  ["finance", "رصيد", "YIELD", "Wallet", "woven"],
  ["nature", "واحة", "OASIS", "Sprout", "desert"],
  ["food", "محمصة", "ROAST", "Coffee", "coffee-bean"],
  ["tech", "شرارة", "SPARK", "Zap", "pixel-spark"],
  ["animals", "موج", "TIDE", "FishSymbol", "fish-abstract"],
] as const;
export const extendedTemplates: Template[] = briefs.map(
  ([category, ar, en, icon, mark], i) => ({
    id: "collection-" + i,
    category,
    ar,
    en,
    icon,
    mark,
    font: ["cairo", "amiri", "montserrat", "playfair-display"][
      Math.floor(i / 4) % 4
    ],
    palette: i % 8,
    layout: newLayouts[Math.floor(i / 4)],
  }),
);
export function composeExtended(
  p: Project,
  t: Template,
  title: string,
  c: string[],
  lang: "ar" | "en",
) {
  const ink = c[0],
    accent = c[1],
    paper = c[2];
  const add = (v: Parameters<typeof node>[0]) => p.nodes.push(node(v));
  const shape = (
    asset: string,
    x: number,
    y: number,
    w: number,
    h: number,
    fill = ink,
  ) => add({ asset, x, y, w, h, fill, name: asset });
  const text = (
    value: string,
    x: number,
    y: number,
    size: number,
    fill = ink,
    font = t.font,
  ) => {
    const width =
      t.layout === "split"
        ? 280
        : t.layout === "seal"
          ? 340
          : t.layout === "crest"
            ? 380
            : 520;
    const fit = Math.min(
      size,
      (width - Math.max(0, [...value].length - 1) * (lang === "en" ? 2 : 0)) /
        Math.max(1, [...value].length * (lang === "ar" ? 0.65 : 0.7)),
    );
    add({
      kind: "text",
      text: value,
      name: value,
      font,
      x,
      y,
      w: width,
      h: size * 1.6,
      fontSize: Math.max(8, fit),
      fill,
      spacing: lang === "en" ? 2 : 0,
    });
  };
  const icon = (x: number, y: number, size: number, fill = ink) =>
    add({
      kind: "icon",
      asset: t.icon,
      name: t.icon,
      x,
      y,
      w: size,
      h: size,
      fill,
      strokeWidth: 1.8,
    });
  const mark = (x: number, y: number, size: number, fill = ink) => {
    const m = vectorMarks.find((m) => m.id === t.mark)!;
    add({ ...vectorNode(m), x, y, w: size, h: size, fill });
  };
  const tagline = lang === "ar" ? "بكل شغف، لكل يوم" : "CRAFTED WITH PURPOSE";
  switch (t.layout) {
    case "seal":
      p.background = paper;
      shape("ring", 400, 290, 440, 440);
      shape("ring", 400, 290, 412, 412, accent);
      icon(400, 232, 100);
      text(title, 400, 336, 48);
      text(tagline, 400, 395, 16);
      for (const x of [220, 580]) shape("star", x, 290, 22, 22, accent);
      break;
    case "monogram":
      p.background = ink;
      shape("diamond", 400, 210, 205, 205, accent);
      text(
        [...title][0],
        400,
        215,
        98,
        ink,
        lang === "ar" ? "amiri" : "playfair-display",
      );
      text(title, 400, 382, 52, paper);
      shape("square", 400, 431, 80, 3, accent);
      text(tagline, 400, 475, 17, accent);
      icon(400, 110, 28, paper);
      break;
    case "editorial":
      p.background = paper;
      shape("square", 165, 300, 4, 360, accent);
      mark(282, 180, 100);
      text(title, 448, 300, 72);
      text(tagline, 444, 390, 18);
      shape("square", 448, 350, 330, 3);
      icon(650, 180, 42, accent);
      text("EST. 2026", 448, 450, 14);
      break;
    case "crest":
      p.background = paper;
      shape("shield", 400, 260, 265, 295);
      shape("shield", 400, 250, 224, 242, accent);
      mark(400, 245, 120);
      shape("ribbon", 400, 405, 430, 72);
      text(title, 400, 408, 42, paper);
      text(tagline, 400, 481, 17);
      for (const x of [225, 575]) shape("star", x, 240, 32, 32, accent);
      break;
    case "split":
      p.background = paper;
      shape("square", 215, 300, 290, 340);
      mark(215, 295, 155, accent);
      text(title, 535, 264, 50);
      text(tagline, 535, 335, 14);
      shape("square", 535, 380, 110, 4, accent);
      icon(535, 425, 36);
      break;
    case "orbital":
      p.background = ink;
      shape("ring", 400, 245, 260, 190, accent);
      add({
        asset: "ring",
        name: "Tilted orbit",
        x: 400,
        y: 245,
        w: 260,
        h: 190,
        fill: accent,
        rotation: 60,
        strokeWidth: 2,
      });
      mark(400, 245, 115, paper);
      shape("circle", 515, 200, 22, 22, paper);
      text(title, 400, 415, 55, paper);
      text(tagline, 400, 478, 17, accent);
      break;
  }
  return p;
}
