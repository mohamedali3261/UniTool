import { fabric } from "fabric";
import { cartonGeometry, MM_TO_PX, type CartonSize } from "./geometry";
/** Canvas-level silhouette clips text, images, groups AND backgrounds, including SVG export. */
export function cartonMask(size: CartonSize) {
  const s = MM_TO_PX,
    path = new fabric.Path(cartonGeometry(size).cut, {
      fill: "#000",
      stroke: null,
      strokeWidth: 0,
      scaleX: s,
      scaleY: s,
      objectCaching: true,
    });
  path.set({ left: (path.left ?? 0) * s, top: (path.top ?? 0) * s });
  return path;
}
export function applyCartonBoundary(canvas: fabric.Canvas, size: CartonSize) {
  canvas.clipPath = cartonMask(size);
  canvas.requestRenderAll();
}
export const isCartonGuide = (o: fabric.Object) =>
  String((o as any).id || "").startsWith("packaging-");
