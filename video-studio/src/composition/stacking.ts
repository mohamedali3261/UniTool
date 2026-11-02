import type { TextLayer } from "../types";
/** Legacy template backgrounds are recognized too; explicit flags survive save/load. */
export function isBackgroundText(layer: TextLayer) {
  return layer.backgroundLayer ?? /^خلفية|^ورق الخلفية/.test(layer.name || "");
}
