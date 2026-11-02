import { offsetCut } from "../advanced/core/faces";
import { fabric } from "fabric";
import { cartonGeometry, MM_TO_PX, type CartonSize } from "./geometry";
/** Canvas-level silhouette clips text, images, groups AND backgrounds, including SVG export. */
export function cartonMask(size: CartonSize, bleedMm = 0) {
  const s = MM_TO_PX,
    path = new fabric.Path(
      bleedMm > 0 ? offsetCut(size, bleedMm) : cartonGeometry(size).cut,
      {
        fill: "#000",
        stroke: null,
        strokeWidth: 0,
        scaleX: s,
        scaleY: s,
        objectCaching: true,
      },
    );
  path.set({ left: (path.left ?? 0) * s, top: (path.top ?? 0) * s });
  return path;
}
export function applyCartonBoundary(
  canvas: fabric.Canvas,
  size: CartonSize,
  bleedMm = 0,
) {
  canvas.clipPath = cartonMask(size, bleedMm);
  canvas.requestRenderAll();
}
export const isCartonGuide = (o: fabric.Object) =>
  String((o as any).id || "").startsWith("packaging-");
