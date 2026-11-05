import type { CartonSize } from "./geometry";
import type { ArtworkOptions } from "./artwork";
export type CartonPreset = {
  id: string;
  ar: string;
  en: string;
  category: "compact" | "tall" | "wide";
  size: CartonSize;
  artwork: ArtworkOptions;
};
const preset = (
  id: string,
  ar: string,
  en: string,
  category: CartonPreset["category"],
  width: number,
  height: number,
  depth: number,
  style: ArtworkOptions["style"],
  brand: string,
  product: string,
): CartonPreset => ({
  id,
  ar,
  en,
  category,
  size: {
    width,
    height,
    depth,
    glue: Math.min(12, width * 0.4),
    tuck: Math.min(12, width * 0.25, depth * 0.6),
  },
  artwork: {
    style,
    brand,
    product,
    accent:
      style === "emerald"
        ? "#c9d5ab"
        : style === "rose"
          ? "#883e54"
          : "#d6b77b",
    ml: 50,
    ...(id === "perfume"
      ? {}
      : {
          descriptor: "STUDIO COLLECTION",
          quantity: "MADE WITH CARE",
          sideLabel: brand + "\nCOLLECTION",
        }),
  },
});
/** Different proportions of the same validated reverse-tuck construction, not unimplemented box mechanisms. */
export const CARTON_PRESETS: CartonPreset[] = [
  preset(
    "cube",
    "مكعب هدايا",
    "Gift cube",
    "compact",
    70,
    70,
    70,
    "noir",
    "AUREA",
    "GIFT EDITION",
  ),
  preset(
    "mini",
    "مكعب صغير",
    "Mini cube",
    "compact",
    40,
    40,
    40,
    "rose",
    "PETITE",
    "LITTLE LUXURIES",
  ),
  preset(
    "cosmetics",
    "علبة مستحضرات",
    "Cosmetics carton",
    "compact",
    55,
    90,
    35,
    "rose",
    "BLOOM",
    "DAILY RITUAL",
  ),
  preset(
    "perfume",
    "عطر كلاسيكي",
    "Classic perfume",
    "tall",
    50,
    115,
    35,
    "noir",
    "MAISON",
    "NOCTURNE",
  ),
  preset(
    "serum",
    "علبة سيروم",
    "Serum carton",
    "tall",
    35,
    120,
    30,
    "emerald",
    "VERDE",
    "BOTANICAL",
  ),
  preset(
    "candle",
    "علبة شمعة",
    "Candle carton",
    "compact",
    85,
    100,
    85,
    "emerald",
    "STILL",
    "SLOW MOMENTS",
  ),
  preset(
    "tea",
    "علبة شاي",
    "Tea carton",
    "tall",
    80,
    160,
    55,
    "emerald",
    "LEAF",
    "GREEN TEA",
  ),
  preset(
    "slim",
    "علبة طويلة رفيعة",
    "Tall slim carton",
    "tall",
    45,
    220,
    35,
    "noir",
    "FORME",
    "ESSENTIALS",
  ),
  preset(
    "soap",
    "علبة صابون مسطحة",
    "Flat soap carton",
    "wide",
    100,
    65,
    25,
    "rose",
    "PURE",
    "HANDCRAFTED",
  ),
  preset(
    "chocolate",
    "علبة شوكولاتة عريضة",
    "Wide chocolate carton",
    "wide",
    160,
    100,
    30,
    "noir",
    "CACAO",
    "SIGNATURE",
  ),
  preset(
    "stationery",
    "علبة أقلام",
    "Pencil carton",
    "wide",
    210,
    45,
    25,
    "emerald",
    "PAPER",
    "STUDIO COLLECTION",
  ),
  preset(
    "wide-gift",
    "علبة هدايا عريضة",
    "Wide gift carton",
    "wide",
    180,
    130,
    65,
    "rose",
    "AMOUR",
    "MADE FOR YOU",
  ),
];

export type PackagingFamily = "all" | "carton" | "pizza" | "bakery" | "mailer";
export const BOX_FAMILIES = [
  ["all", "كل العلب", "All boxes"],
  ["carton", "علب المنتجات", "Product cartons"],
  ["pizza", "علب البيتزا", "Pizza boxes"],
  ["bakery", "علب المخبوزات", "Bakery boxes"],
  ["mailer", "غطاء متصل", "Hinged mailers"],
] as const;
const hingedPreset = (
  family: "pizza" | "bakery" | "mailer",
  id: string,
  ar: string,
  en: string,
  width: number,
  depth: number,
  height: number,
): CartonPreset => ({
  id,
  ar,
  en,
  category: "wide",
  size: {
    construction: "hinged-lid",
    family,
    width,
    depth,
    height,
    glue: 12,
    tuck: Math.min(20, height * 0.5),
  },
  artwork: {
    style: "noir",
    stock: "kraft",
    brand:
      family === "pizza" ? "FORNO" : family === "bakery" ? "BAKED" : "PARCEL",
    product:
      family === "pizza"
        ? "WOOD FIRED PIZZA"
        : family === "bakery"
          ? "FRESHLY BAKED"
          : "PACKED WITH CARE",
    descriptor: "YOUR BRAND · YOUR DESIGN",
    quantity: "MADE WITH CARE",
    accent:
      family === "pizza"
        ? "#913627"
        : family === "bakery"
          ? "#503528"
          : "#293f35",
    ml: 50,
  },
});
export const HINGED_PRESETS: CartonPreset[] = [
  ...[6, 8, 10, 12, 14, 16, 18, 20, 24].map((inches) =>
    hingedPreset(
      "pizza",
      "pizza-" + inches,
      `بيتزا ${inches} بوصة`,
      `Pizza ${inches} inch`,
      Number((inches * 25.4).toFixed(2)),
      Number((inches * 25.4).toFixed(2)),
      inches <= 8 ? 35 : inches <= 14 ? 40 : 50,
    ),
  ),
  ...[150, 200, 250, 300].map((mm, i) =>
    hingedPreset(
      "bakery",
      "bakery-" + mm,
      `مخبوزات ${mm} مم`,
      `Bakery ${mm} mm`,
      mm,
      mm,
      [60, 80, 100, 100][i],
    ),
  ),
  hingedPreset(
    "mailer",
    "mailer-small",
    "غطاء متصل صغير",
    "Small hinged mailer",
    180,
    120,
    40,
  ),
  hingedPreset(
    "mailer",
    "mailer-medium",
    "غطاء متصل متوسط",
    "Medium hinged mailer",
    250,
    180,
    60,
  ),
  hingedPreset(
    "mailer",
    "mailer-large",
    "غطاء متصل كبير",
    "Large hinged mailer",
    350,
    250,
    80,
  ),
];
export const ALL_BOX_PRESETS = [...CARTON_PRESETS, ...HINGED_PRESETS];
export const boxFamily = (
  size?: CartonSize,
): Exclude<PackagingFamily, "all"> =>
  size?.construction === "hinged-lid" ? size.family || "mailer" : "carton";
