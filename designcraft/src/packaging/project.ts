import { withCartonPrecision } from "./precision";
import { cartonMask } from "./boundary";
import { fabric } from "fabric";
import type { ProjectItem } from "../types";
import {
  cartonGeometry,
  MM_TO_PX,
  CUT_COLOR,
  FOLD_COLOR,
  type CartonSize,
} from "./geometry";
export function createCartonProject(
  size: CartonSize,
  title: string,
): ProjectItem {
  const g = cartonGeometry(size),
    s = MM_TO_PX,
    outline = new fabric.Path(g.cut, {
      fill: null,
      stroke: CUT_COLOR,
      strokeWidth: 0.2,
      scaleX: s,
      scaleY: s,
    });
  outline.set({ left: (outline.left ?? 0) * s, top: (outline.top ?? 0) * s });
  const objects = [
    outline,
    ...g.folds.map(
      ([x1, y1, x2, y2]) =>
        new fabric.Line([x1 * s, y1 * s, x2 * s, y2 * s], {
          stroke: FOLD_COLOR,
          strokeWidth: 0.2 * s,
          strokeDashArray: [2 * s, s],
        }),
    ),
  ].map((o, i) => ({
    ...withCartonPrecision(() => o.toObject()),
    id: `packaging-${i === 0 ? "cut" : `fold-${i}`}`,
    name: i === 0 ? "Cut / قص" : `Fold / طي ${i}`,
    locked: true,
    selectable: false,
    evented: false,
    lockMovementX: true,
    lockMovementY: true,
    lockScalingX: true,
    lockScalingY: true,
    lockRotation: true,
  }));
  return {
    id: `proj-carton-${crypto.randomUUID()}`,
    title: title.trim() || "Carton / قالب علبة",
    category: "packaging",
    width: g.width * s,
    height: g.height * s,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    packaging: { kind: "reverse-tuck", size: { ...size }, version: 1 },
    canvasData: {
      version: fabric.version,
      background: "#FFFFFF",
      objects,
      clipPath: withCartonPrecision(() => cartonMask(size).toObject()),
    },
  };
}
