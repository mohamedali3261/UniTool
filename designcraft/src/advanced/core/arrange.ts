import { fabric } from "fabric";
import { isCartonGuide } from "../../packaging/boundary";
export type Alignment =
  "left" | "center" | "right" | "top" | "middle" | "bottom";
export interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}
export function distributePositions(boxes: Rect[], axis: "x" | "y") {
  if (boxes.length < 3) throw Error("Select at least three objects");
  const p = axis === "x" ? "left" : "top",
    dim = axis === "x" ? "width" : "height";
  const sorted = boxes
    .map((b, index) => ({ ...b, index }))
    .sort((a, b) => a[p] - b[p]);
  const first = sorted[0],
    last = sorted.at(-1)!;
  const gap =
    (last[p] + last[dim] - first[p] - sorted.reduce((n, b) => n + b[dim], 0)) /
    (sorted.length - 1);
  let cursor = first[p];
  return sorted.map((b) => {
    const result = { index: b.index, delta: cursor - b[p], gap };
    cursor += b[dim] + gap;
    return result;
  });
}
export function isEditable(o: any): boolean {
  return (
    !!o &&
    !isCartonGuide(o) &&
    !o.lockMovementX &&
    !o.lockMovementY &&
    !o.locked &&
    !(o.getObjects?.() || []).some((child: any) => !isEditable(child))
  );
}
export function selection(canvas: fabric.Canvas, min = 1) {
  const objects = canvas.getActiveObjects();
  if (objects.length < min || objects.some((o) => !isEditable(o)))
    throw Error("Select enough unlocked artwork objects");
  return objects;
}
function restore(canvas: fabric.Canvas, objects: fabric.Object[]) {
  canvas.setActiveObject(
    objects.length === 1
      ? objects[0]
      : new fabric.ActiveSelection(objects, { canvas }),
  );
  canvas.requestRenderAll();
}
export function arrange(
  canvas: fabric.Canvas,
  action: Alignment | "distributeX" | "distributeY",
  relative: "canvas" | "selection",
) {
  const objects = selection(canvas, action.startsWith("distribute") ? 3 : 1);
  canvas.discardActiveObject();
  try {
    const boxes = objects.map((o) => o.getBoundingRect(true, true));
    if (action.startsWith("distribute")) {
      const axis = action === "distributeX" ? "x" : "y";
      for (const change of distributePositions(boxes, axis)) {
        const o = objects[change.index];
        o.set(
          axis === "x" ? "left" : "top",
          (axis === "x" ? o.left : o.top)! + change.delta,
        );
        o.setCoords();
      }
    } else {
      const zoom = canvas.getZoom() || 1;
      const ref =
        relative === "canvas"
          ? {
              left: 0,
              top: 0,
              width: canvas.getWidth() / zoom,
              height: canvas.getHeight() / zoom,
            }
          : union(boxes);
      objects.forEach((o, i) => {
        const b = boxes[i],
          horizontal = ["left", "center", "right"].includes(action),
          key = horizontal ? "left" : "top";
        const factor =
          action === "center" || action === "middle"
            ? 0.5
            : action === "right" || action === "bottom"
              ? 1
              : 0;
        const delta = horizontal
          ? ref.left + ref.width * factor - b.left - b.width * factor
          : ref.top + ref.height * factor - b.top - b.height * factor;
        o.set(key, (o[key] || 0) + delta);
        o.setCoords();
      });
    }
  } finally {
    restore(canvas, objects);
  }
}
export function union(boxes: Rect[]): Rect {
  const left = Math.min(...boxes.map((b) => b.left)),
    top = Math.min(...boxes.map((b) => b.top));
  return {
    left,
    top,
    width: Math.max(...boxes.map((b) => b.left + b.width)) - left,
    height: Math.max(...boxes.map((b) => b.top + b.height)) - top,
  };
}
export function groupSelection(canvas: fabric.Canvas) {
  selection(canvas, 2);
  const active: any = canvas.getActiveObject();
  if (active?.type !== "activeSelection")
    throw Error("Select multiple objects");
  const group = active.toGroup();
  group.subTargetCheck = true;
  canvas.setActiveObject(group);
  canvas.requestRenderAll();
}
export function ungroupSelection(canvas: fabric.Canvas) {
  const active: any = canvas.getActiveObject();
  if (active?.type !== "group" || !isEditable(active))
    throw Error("Select an unlocked group");
  active.toActiveSelection();
  canvas.requestRenderAll();
}
export function transformSelection(
  canvas: fabric.Canvas,
  values: {
    x: number;
    y: number;
    width: number;
    height: number;
    angle: number;
  },
  ratio: boolean,
) {
  const objects = selection(canvas);
  if (objects.length !== 1) throw Error("Select one object");
  const o = objects[0];
  if (
    !Object.values(values).every(Number.isFinite) ||
    values.width < 1 ||
    values.height < 1 ||
    Math.max(values.width, values.height) > 12000 ||
    Math.max(Math.abs(values.x), Math.abs(values.y)) > 100000
  )
    throw Error("Invalid dimensions");
  const old = {
    left: o.left,
    top: o.top,
    scaleX: o.scaleX,
    scaleY: o.scaleY,
    angle: o.angle,
  };
  try {
    o.set("angle", values.angle);
    o.setCoords();
    let bounds = o.getBoundingRect(true, true);
    let sx = values.width / bounds.width,
      sy = sx;
    if (!ratio) {
      if (o.skewX || o.skewY) throw Error("Use ratio lock for skewed objects");
      const c = o.getCoords(true, true),
        ux = Math.abs(c[1].x - c[0].x),
        uy = Math.abs(c[1].y - c[0].y),
        vx = Math.abs(c[3].x - c[0].x),
        vy = Math.abs(c[3].y - c[0].y),
        det = ux * vy - uy * vx;
      if (Math.abs(det) < 1e-6) throw Error("Use ratio lock near 45 degrees");
      sx = (values.width * vy - values.height * vx) / det;
      sy = (values.height * ux - values.width * uy) / det;
      if (sx <= 0 || sy <= 0)
        throw Error("These rotated bounds cannot be reached; use ratio lock");
    }
    o.set({ scaleX: (o.scaleX || 1) * sx, scaleY: (o.scaleY || 1) * sy });
    o.setCoords();
    bounds = o.getBoundingRect(true, true);
    o.set({
      left: (o.left || 0) + values.x - bounds.left,
      top: (o.top || 0) + values.y - bounds.top,
    });
    o.setCoords();
  } catch (error) {
    o.set(old);
    o.setCoords();
    throw error;
  }
  canvas.requestRenderAll();
}
