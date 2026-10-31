import type { TextLayer } from "../../../video-studio/src/types";
import type { InterfaceScene } from "../../../video-studio/src/templates/interface-flow/scenes";
export type CategoryId =
  | "typography"
  | "shapes"
  | "panels"
  | "backgrounds"
  | "motion"
  | "scenes"
  | "kits";
export type LibraryElement = {
  id: string;
  name: string;
  source: string;
  sourceName: string;
  category: CategoryId;
  kind: "layer" | "svg" | "scene" | "group";
  layers?: TextLayer[];
  placement?: "background" | "content";
  layer?: TextLayer;
  svg?: string;
  scene?: InterfaceScene;
  animated: boolean;
};
export type Category = {
  id: CategoryId;
  name: string;
  description: string;
  symbol: string;
};
