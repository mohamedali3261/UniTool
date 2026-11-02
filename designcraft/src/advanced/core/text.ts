import { fabric } from "fabric";
import { normalTextFill } from "../../utils/textReset";
export const isText = (o: any) =>
  o && ["textbox", "i-text", "text"].includes(o.type);
const keys = [
  "fontFamily",
  "fontSize",
  "fontWeight",
  "fontStyle",
  "fill",
  "stroke",
  "strokeWidth",
  "underline",
  "overline",
  "linethrough",
  "charSpacing",
  "lineHeight",
  "textAlign",
  "textBackgroundColor",
] as const;
export function copyFormatting(o: any) {
  if (!isText(o)) throw Error("Select text");
  const data: any = {};
  for (const key of keys) {
    const value = o[key];
    data[key] =
      value && typeof value === "object" && value.toObject
        ? { gradient: value.toObject() }
        : value;
  }
  data.shadow = o.shadow?.toObject?.() || null;
  return data;
}
export function applyFormatting(o: any, data: any) {
  if (!isText(o) || !data) throw Error("Copy text formatting first");
  const next: any = { ...data, styles: {} };
  for (const key of ["fill", "stroke"])
    if (next[key]?.gradient)
      next[key] = new fabric.Gradient(next[key].gradient);
  next.shadow = data.shadow ? new fabric.Shadow(data.shadow) : null;
  o.set(next);
  o.initDimensions?.();
  o.setCoords();
  o.dirty = true;
}
export function clearFormatting(o: any, background: unknown) {
  if (!isText(o)) throw Error("Select text");
  o.set({
    styles: {},
    fontFamily: "Cairo",
    fontWeight: 400,
    fontStyle: "normal",
    underline: false,
    overline: false,
    linethrough: false,
    fill: normalTextFill(background),
    stroke: null,
    strokeWidth: 0,
    shadow: null,
    textBackgroundColor: "",
    backgroundColor: "",
    charSpacing: 0,
    lineHeight: 1.2,
    path: null,
  });
  o.initDimensions?.();
  o.setCoords();
  o.dirty = true;
}
export type FitMode = "shrink" | "grow" | "warn";
export function applyTextFit(o: any) {
  if (!isText(o) || !o.textFitMode) return;
  const mode = o.textFitMode as FitMode;
  const height = o.textFitHeight || 120;
  if (mode === "shrink") {
    let low = 8,
      high = Math.min(300, o.textFitMaxSize || o.fontSize || 48),
      best = 8;
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      o.set("fontSize", mid);
      o.initDimensions();
      if (o.height <= height) {
        best = mid;
        low = mid + 1;
      } else high = mid - 1;
    }
    o.set("fontSize", best);
  }
  o.initDimensions?.();
  o.setCoords();
  o.dirty = true;
  o.textFitOverflow = mode !== "grow" && o.height > height + 1;
}
export const EXTRA_PROPS = [
  "textFitMode",
  "textFitHeight",
  "textFitMaxSize",
  "id",
  "name",
  "locked",
  "lockMovementX",
  "lockMovementY",
  "lockScalingX",
  "lockScalingY",
  "lockRotation",
  "selectable",
  "evented",
  "clipCornerTL",
  "clipCornerTR",
  "clipCornerBR",
  "clipCornerBL",
  "cropTop",
  "cropBottom",
  "cropLeft",
  "cropRight",
  "fadeTop",
  "fadeBottom",
  "fadeLeft",
  "fadeRight",
  "fadeRadial",
  "_originalSrc",
];
