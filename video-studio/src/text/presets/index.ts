import { editorialPresets } from "./editorial";
import { socialPresets } from "./social";
import { commercePresets } from "./commerce";
import { quotesPresets } from "./quotes";
import { journeysPresets } from "./journeys";
import { learningPresets } from "./learning";
export const textPresets = [
  ...editorialPresets,
  ...socialPresets,
  ...commercePresets,
  ...quotesPresets,
  ...journeysPresets,
  ...learningPresets,
];
export const textCategories = [
  {
    id: "editorial",
    name: "عناوين وحكايات",
  },
  {
    id: "social",
    name: "سوشيال ودعوات",
  },
  {
    id: "commerce",
    name: "منتجات وعروض",
  },
  {
    id: "quotes",
    name: "اقتباسات ومشاعر",
  },
  {
    id: "journeys",
    name: "سفر ويوميات",
  },
  {
    id: "learning",
    name: "تعليم وشرح",
  },
];
