import { extendedTemplates, composeExtended } from "./extended-templates";
import { node, uid, type Project } from "./types";
import { palettes } from "./catalog";
export type Template = {
  id: string;
  ar: string;
  en: string;
  category: string;
  icon: string;
  font: string;
  palette: number;
  layout:
    | "vertical"
    | "horizontal"
    | "badge"
    | "seal"
    | "monogram"
    | "editorial"
    | "crest"
    | "split"
    | "orbital";
  mark?: string;
};
const industries = [
  ["nature", "نواة", "NAWA", "Leaf", "cairo"],
  ["tech", "مدار", "ORBIT", "Orbit", "inter"],
  ["food", "بنّ", "BUNN", "Coffee", "amiri"],
  ["estate", "رُكن", "RUKN", "Building2", "tajawal"],
  ["brand", "أثير", "ETHER", "Gem", "playfair-display"],
  ["sport", "ذروة", "PEAK", "Mountain", "oswald"],
  ["nature", "جذور", "ROOTS", "Sprout", "lemonada"],
  ["tech", "نقطة", "DOT", "Code2", "montserrat"],
  ["food", "حَبّة", "HABBA", "Wheat", "lateef"],
  ["brand", "توازن", "BALANCE", "Infinity", "raleway"],
  ["animals", "جناح", "WING", "Bird", "changa"],
  ["brand", "رؤية", "VISION", "Aperture", "poppins"],
] as const;
export const templates: Template[] = [
  ...industries.flatMap(([category, ar, en, icon, font], i) =>
    (["vertical", "horizontal", "badge"] as const).map((layout, j) => ({
      id: `${category}-${i}-${j}`,
      ar: ar + " / " + ["01", "02", "03"][j],
      en: en + " / " + ["01", "02", "03"][j],
      category,
      icon,
      font,
      palette: (i + j) % palettes.length,
      layout,
    })),
  ),
  ...extendedTemplates,
];
/** القالب مجموعة عناصر مستقلة، مش صورة مسطحة. */
export function templateProject(
  t: Template,
  lang: "ar" | "en",
  brand?: string,
  colors?: string[],
): Project {
  const palette = colors || palettes[t.palette],
    title = brand || t[lang].split(" / ")[0];
  const p: Project = {
    version: 1,
    id: uid(),
    name: title,
    width: 800,
    height: 600,
    background: "",
    nodes: [],
    updated: Date.now(),
  };
  if (extendedTemplates.some((v) => v.id === t.id))
    return composeExtended(p, t, title, palette, lang);
  if (t.layout === "badge")
    p.nodes.push(
      node({
        asset: "ring",
        name: "Badge frame",
        x: 400,
        y: 285,
        w: 350,
        h: 350,
        fill: palette[0],
        strokeWidth: 3,
      }),
    );
  const horizontal = t.layout === "horizontal";
  p.nodes.push(
    node({
      kind: "icon",
      asset: t.icon,
      name: t.icon,
      x: horizontal ? 245 : 400,
      y: horizontal ? 300 : 235,
      w: horizontal ? 150 : 140,
      h: horizontal ? 150 : 140,
      fill: palette[0],
      strokeWidth: 2,
    }),
  );
  p.nodes.push(
    node({
      kind: "text",
      name: "Brand name",
      text: title,
      font: t.font,
      fontSize: horizontal ? 62 : 56,
      x: horizontal ? 510 : 400,
      y: horizontal ? 285 : 370,
      w: horizontal ? 350 : 420,
      h: 90,
      fill: palette[0],
      spacing: lang === "en" ? 3 : 0,
    }),
  );
  p.nodes.push(
    node({
      kind: "text",
      name: "Tagline",
      text: lang === "ar" ? "تفاصيل تصنع الفرق" : "A LITTLE DIFFERENT.",
      font: "tajawal",
      fontSize: 21,
      x: horizontal ? 510 : 400,
      y: horizontal ? 345 : 430,
      w: horizontal ? 340 : 400,
      h: 40,
      fill: palette[1],
      spacing: lang === "en" ? 4 : 0,
    }),
  );
  return p;
}
