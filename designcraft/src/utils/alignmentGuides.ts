import type { fabric } from "fabric";
export interface Bounds {
  left: number;
  top: number;
  width: number;
  height: number;
}
export function closestAlignment(
  target: Bounds,
  others: Bounds[],
  tolerance: number,
) {
  const result = {
    dx: 0,
    dy: 0,
    x: null as number | null,
    y: null as number | null,
  };
  let bestX = tolerance,
    bestY = tolerance;
  const xs = (b: Bounds) => [b.left, b.left + b.width / 2, b.left + b.width],
    ys = (b: Bounds) => [b.top, b.top + b.height / 2, b.top + b.height];
  for (const other of others) {
    for (const x of xs(other))
      for (const own of xs(target)) {
        const diff = x - own;
        if (Math.abs(diff) <= bestX) {
          bestX = Math.abs(diff);
          result.dx = diff;
          result.x = x;
        }
      }
    for (const y of ys(other))
      for (const own of ys(target)) {
        const diff = y - own;
        if (Math.abs(diff) <= bestY) {
          bestY = Math.abs(diff);
          result.dy = diff;
          result.y = y;
        }
      }
  }
  return result;
}
/** Screen-space overlay only: never objects, history, saved JSON or exports. Alt bypasses snapping. */
export function installAlignmentGuides(canvas: fabric.Canvas) {
  let drawn = false,
    movingActive = false;
  let guides: { x: number | null; y: number | null } = { x: null, y: null };
  const moving = (event: any) => {
    const target = event.target;
    if (!target) return;
    movingActive = true;
    if (event.e?.altKey) {
      guides = { x: null, y: null };
      return;
    }
    target.setCoords();
    const selected =
      target.type === "activeSelection" ? target.getObjects() : [];
    const others = canvas
      .getObjects()
      .filter(
        (o: any) =>
          o !== target &&
          !selected.includes(o) &&
          o.visible !== false &&
          !String(o.id || "").startsWith("packaging-"),
      )
      .map((o) => o.getBoundingRect(true, true));
    const zoom = canvas.getZoom() || 1;
    others.push({
      left: 0,
      top: 0,
      width: canvas.getWidth() / zoom,
      height: canvas.getHeight() / zoom,
    });
    const snap = closestAlignment(
      target.getBoundingRect(true, true),
      others,
      5 / zoom,
    );
    if (!target.lockMovementX) target.left = (target.left || 0) + snap.dx;
    if (!target.lockMovementY) target.top = (target.top || 0) + snap.dy;
    target.setCoords();
    guides = {
      x: target.lockMovementX ? null : snap.x,
      y: target.lockMovementY ? null : snap.y,
    };
  };
  const before = () => {
    if (drawn) {
      canvas.clearContext(canvas.contextTop);
      drawn = false;
    }
  };
  const after = () => {
    if (!movingActive && guides.x === null && guides.y === null) return;
    drawn = true;
    const ctx = canvas.contextTop,
      v = canvas.viewportTransform || [1, 0, 0, 1, 0, 0];
    ctx.save();
    ctx.strokeStyle = "#f472b6";
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    if (guides.x !== null) {
      const x = guides.x * v[0] + v[4];
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.getHeight());
    }
    if (guides.y !== null) {
      const y = guides.y * v[3] + v[5];
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.getWidth(), y);
    }
    ctx.stroke();
    ctx.restore();
  };
  const clear = () => {
    movingActive = false;
    guides = { x: null, y: null };
    canvas.requestRenderAll();
  };
  canvas.on("object:moving", moving);
  canvas.on("before:render", before);
  canvas.on("after:render", after);
  canvas.on("mouse:up", clear);
  canvas.on("selection:cleared", clear);
  return () => {
    canvas.off("object:moving", moving);
    canvas.off("before:render", before);
    canvas.off("after:render", after);
    canvas.off("mouse:up", clear);
    canvas.off("selection:cleared", clear);
  };
}
