import type { Element } from "./types";
/** علامات أصلية بمسارات حقيقية، وليس صور معاينة. كل علامة تقبل تغيير اللون والتدرج. */
export type VectorMark = {
  id: string;
  ar: string;
  en: string;
  category: string;
  paths: { d: string; fill: string }[];
};
const mark = (
  id: string,
  ar: string,
  en: string,
  category: string,
  d: string,
): VectorMark => ({ id, ar, en, category, paths: [{ d, fill: "#235c4c" }] });
const polygon = (count: number, inner = 1) =>
  Array.from({ length: count * (inner === 1 ? 1 : 2) }, (_, i) => {
    const a =
        -Math.PI / 2 + (i * Math.PI * 2) / (count * (inner === 1 ? 1 : 2)),
      r = 50 * (i % 2 && inner !== 1 ? inner : 1);
    return `${i ? "L" : "M"}${(64 + Math.cos(a) * r).toFixed(3)} ${(64 + Math.sin(a) * r).toFixed(3)}`;
  }).join("") + "Z";
export const vectorMarks: VectorMark[] = [
  mark(
    "north-arrow",
    "سهم الشمال",
    "North arrow",
    "geometry",
    "M64 8L108 112L64 88L20 112ZM64 30L64 78L94 96Z",
  ),
  mark(
    "rising-peaks",
    "قمم متداخلة",
    "Rising peaks",
    "geometry",
    "M4 108L44 24L64 66L84 12L124 108H102L84 58L64 108H48L44 70L26 108Z",
  ),
  mark(
    "ribbon-n",
    "حرف شريطي",
    "Ribbon monogram",
    "geometry",
    "M18 108V20H40L88 75V20H110V108H88L40 53V108Z",
  ),
  mark(
    "woven",
    "نسيج",
    "Woven mark",
    "geometry",
    "M12 44L44 12L64 32L84 12L116 44L96 64L116 84L84 116L64 96L44 116L12 84L32 64ZM44 40L40 44L60 64L40 84L44 88L64 68L84 88L88 84L68 64L88 44L84 40L64 60Z",
  ),
  mark(
    "petal-four",
    "زهرة رباعية",
    "Four petals",
    "ornaments",
    "M64 60C0 64 12 0 60 60C64 0 128 12 68 60C128 64 116 128 68 68C64 128 0 116 60 68Z",
  ),
  mark(
    "tulip",
    "توليب",
    "Tulip",
    "nature",
    "M22 26Q44 28 64 60Q84 28 106 26Q110 84 70 88V116H58V88Q18 84 22 26ZM64 6Q90 32 64 54Q38 32 64 6Z",
  ),
  mark(
    "double-leaf",
    "ورقتان",
    "Twin leaves",
    "nature",
    "M60 110V68Q12 74 12 20Q58 20 62 60Q68 8 116 8Q120 68 72 70V110Z",
  ),
  mark(
    "desert",
    "رمال وشمس",
    "Desert sun",
    "nature",
    "M44 38A20 20 0 1 1 84 38ZM4 78Q34 38 64 78Q94 118 124 78V94Q94 128 64 94Q34 54 4 94ZM4 106Q34 70 64 106Q94 138 124 106V120H4Z",
  ),
  mark(
    "droplet-cut",
    "قطرة هندسية",
    "Cut droplet",
    "nature",
    "M64 8C48 36 20 56 20 82A44 38 0 0 0 108 82C108 56 80 36 64 8ZM64 42L84 92H44Z",
  ),
  mark(
    "wing-abstract",
    "جناح هندسي",
    "Abstract wing",
    "animals",
    "M8 20L116 48L70 64L40 108L40 68ZM52 58L82 48L30 34Z",
  ),
  mark(
    "fish-abstract",
    "سمكة هندسية",
    "Abstract fish",
    "animals",
    "M8 64L32 36Q72 4 108 48L124 28V100L108 80Q72 124 32 92ZM80 48A5 5 0 1 0 90 48A5 5 0 1 0 80 48Z",
  ),
  mark(
    "coffee-bean",
    "حبة بن",
    "Coffee bean",
    "food",
    "M36 18C88 -4 130 60 94 104C56 146 -8 76 24 32L50 50L62 82L92 96L82 76L72 42Z",
  ),
  mark(
    "bread",
    "رغيف",
    "Bakery loaf",
    "food",
    "M12 100V56Q12 12 64 12Q116 12 116 56V100ZM26 86H102V56Q102 28 64 28Q26 28 26 56ZM40 40L52 36L64 66L52 70ZM68 36L80 40L92 66L80 70Z",
  ),
  mark(
    "pulse-cross",
    "صليب نبض",
    "Pulse cross",
    "health",
    "M46 8H82V44H118V80H82V116H46V80H10V44H46ZM20 58V66H48L58 50L70 78L82 64H108V56H78L72 62L60 34L44 58Z",
  ),
  mark(
    "open-book",
    "كتاب مفتوح",
    "Open book",
    "education",
    "M8 20Q36 10 60 26V108Q32 90 8 100ZM68 26Q92 10 120 20V100Q96 90 68 108ZM22 36V80Q40 80 48 86V36ZM80 36V86Q98 80 106 80V36Z",
  ),
  mark(
    "infinity-cut",
    "حلقتان",
    "Linked loops",
    "tech",
    "M64 42C10 -16 -28 104 34 104Q54 104 64 86Q74 104 94 104C156 104 118 -16 64 42ZM54 64Q30 30 20 62Q10 96 40 82ZM74 64L88 82Q118 96 108 62Q98 30 74 64Z",
  ),
  mark(
    "pixel-spark",
    "بكسل مضيء",
    "Pixel spark",
    "tech",
    "M52 8H76V40H108V64H76V96H52V64H20V40H52ZM92 88H116V112H92ZM8 96H24V112H8Z",
  ),
  mark(
    "skyline",
    "أفق المدينة",
    "City skyline",
    "estate",
    "M8 112V56H30V112H40V28H62V112H72V8H94V112H104V66H122V124H8Z",
  ),
  mark(
    "roof-line",
    "سقف معاصر",
    "Modern roof",
    "estate",
    "M4 60L64 8L124 60L112 74L64 32L16 74ZM24 70H44V102H84V70H104V120H24Z",
  ),
  mark(
    "chevrons",
    "شيفرون",
    "Forward chevrons",
    "sport",
    "M8 20H44L80 64L44 108H8L44 64ZM56 20H92L128 64L92 108H56L92 64Z",
  ),
  ...[6, 8, 12, 20].map((n) =>
    mark(
      "rosette-" + n,
      "زخرفة " + n,
      "Rosette " + n,
      "ornaments",
      polygon(n, 0.64),
    ),
  ),
  ...[5, 6, 8, 12].map((n) =>
    mark("emblem-" + n, "شارة " + n, "Emblem " + n, "frames", polygon(n)),
  ),
];
export function vectorNode(mark: VectorMark): Partial<Element> {
  return {
    kind: "vector",
    asset: mark.id,
    name: mark.en,
    paths: structuredClone(mark.paths),
    recolor: true,
    fill: "#235c4c",
    w: 180,
    h: 180,
  };
}
