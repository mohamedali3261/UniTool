import type { fabric } from "fabric";
import { faces } from "./faces";
import { isCartonGuide } from "../../packaging/boundary";
import {
  cartonGeometry,
  MM_TO_PX,
  type CartonSize,
} from "../../packaging/geometry";
export interface Finding {
  kind: "hidden" | "outside" | "dpi" | "safe" | "overflow";
  name: string;
  detail: string;
}
export function preflight(
  canvas: fabric.Canvas,
  width: number,
  height: number,
  size?: CartonSize,
  safeMm = 3,
): Finding[] {
  const result: Finding[] = [];
  function visit(objects: any[], hidden = false) {
    for (const o of objects) {
      if (isCartonGuide(o)) continue;
      const name = String(o.name || o.text?.slice(0, 35) || o.type || "Object");
      const isHidden = hidden || o.visible === false || o.opacity === 0;
      if (isHidden)
        result.push({ kind: "hidden", name, detail: "Hidden / مخفي" });
      const b = o.getBoundingRect(true, true);
      if (
        b.left < 0 ||
        b.top < 0 ||
        b.left + b.width > width + 0.5 ||
        b.top + b.height > height + 0.5
      )
        result.push({
          kind: "outside",
          name,
          detail: "Outside canvas / خارج اللوحة",
        });
      if (o.type === "image" && !isHidden) {
        const scaling = o.getObjectScaling(),
          dpi =
            96 /
            Math.max(Math.abs(scaling.scaleX), Math.abs(scaling.scaleY), 1e-9);
        if (dpi < 300)
          result.push({
            kind: "dpi",
            name,
            detail: `${Math.floor(dpi)} DPI < 300`,
          });
      }
      if (o.textFitOverflow)
        result.push({
          kind: "overflow",
          name,
          detail: "Text exceeds its box / النص يتجاوز الصندوق",
        });
      if (size && !isHidden && ["text", "textbox", "i-text"].includes(o.type)) {
        const margin = safeMm * MM_TO_PX;
        const inside = faces(size).some(
          (p) =>
            b.left >= p.x * MM_TO_PX + margin &&
            b.top >= p.y * MM_TO_PX + margin &&
            b.left + b.width <= (p.x + p.width) * MM_TO_PX - margin &&
            b.top + b.height <= (p.y + p.height) * MM_TO_PX - margin,
        );
        if (!inside)
          result.push({
            kind: "safe",
            name,
            detail: "Review cut/fold safety / راجع قرب النص من القص أو الطي",
          });
      }
      if (o.getObjects) visit(o.getObjects(), isHidden);
    }
  }
  visit(canvas.getObjects());
  return result;
}
