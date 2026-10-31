import type { LibraryElement } from "./types";
import { category as typography } from "./categories/typography";
import { category as shapes } from "./categories/shapes";
import { category as panels } from "./categories/panels";
import { category as backgrounds } from "./categories/backgrounds";
import { category as motion } from "./categories/motion";
import { category as scenes } from "./categories/scenes";
import { load as loadType } from "./categories/typography/load";
import { load as loadShapes } from "./categories/shapes/load";
import { load as loadPanels } from "./categories/panels/load";
import { load as loadBackgrounds } from "./categories/backgrounds/load";
import { load as loadMotion } from "./categories/motion/load";
import { load as loadScenes } from "./categories/scenes/load";
export const categories = [
  typography,
  shapes,
  panels,
  backgrounds,
  motion,
  scenes,
];
export function loadElements(): LibraryElement[] {
  const loaders: Array<() => LibraryElement[]> = [
    loadType,
    loadShapes,
    loadPanels,
    loadBackgrounds,
    loadMotion,
    loadScenes,
  ];
  return loaders.flatMap((load) => load());
}
