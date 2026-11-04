import { fabric } from "fabric";
import { cartonGeometry, MM_TO_PX, type CartonSize } from "./geometry";
import { cartonAssembly, paperPoint } from "./preview3d/assembly";
import { createCartonProject } from "./project";
import { isCartonGuide, applyCartonBoundary } from "./boundary";
function regions(size: CartonSize) {
  return cartonAssembly(size).map((piece) => {
    const points = piece.polygon.map((p) => paperPoint(piece, p)),
      xs = points.map((p) => p[0]),
      ys = points.map((p) => p[1]);
    return {
      id: piece.id,
      x: Math.min(...xs) * MM_TO_PX,
      y: Math.min(...ys) * MM_TO_PX,
      width: (Math.max(...xs) - Math.min(...xs)) * MM_TO_PX,
      height: (Math.max(...ys) - Math.min(...ys)) * MM_TO_PX,
    };
  });
}
/** Preserve native objects, crop, text, IDs and relative face layout; never rasterize artwork. */
export async function resizeCarton(
  canvas: fabric.Canvas,
  before: CartonSize,
  after: CartonSize,
) {
  const old = cartonGeometry(before),
    next = cartonGeometry(after),
    from = regions(before),
    to = regions(after);
  // Prepare new guides before touching the live design.
  const guides = await new Promise<fabric.Object[]>((resolve) =>
    fabric.util.enlivenObjects(
      createCartonProject(after, "").canvasData.objects,
      resolve,
      "fabric",
    ),
  );
  canvas.discardActiveObject();
  const adapt = (object: fabric.Object, background = false) => {
    const center = object.getCenterPoint(),
      bounds = object.getBoundingRect(true, true);
    const whole =
      background ||
      (bounds.width >= old.width * MM_TO_PX * 0.85 &&
        bounds.height >= old.height * MM_TO_PX * 0.85);
    const region = whole
      ? undefined
      : from.find(
          (r) =>
            center.x >= r.x - 1e-5 &&
            center.x <= r.x + r.width + 1e-5 &&
            center.y >= r.y - 1e-5 &&
            center.y <= r.y + r.height + 1e-5,
        );
    const a = region || {
        x: 0,
        y: 0,
        width: old.width * MM_TO_PX,
        height: old.height * MM_TO_PX,
      },
      b = region
        ? to.find((r) => r.id === region.id)!
        : {
            x: 0,
            y: 0,
            width: next.width * MM_TO_PX,
            height: next.height * MM_TO_PX,
          };
    const rx = b.width / a.width,
      ry = b.height / a.height,
      stretch = object.type === "rect" && Math.abs(object.angle || 0) < 1e-8;
    const sx = stretch ? rx : Math.min(rx, ry),
      sy = stretch ? ry : sx;
    const target = new fabric.Point(
      b.x + (center.x - a.x) * rx,
      b.y + (center.y - a.y) * ry,
    );
    if (object.clipPath?.absolutePositioned) {
      const clip = object.clipPath,
        transform = [
          sx,
          0,
          0,
          sy,
          target.x - center.x * sx,
          target.y - center.y * sy,
        ];
      fabric.util.applyTransformToObject(
        clip,
        fabric.util.multiplyTransformMatrices(
          transform,
          clip.calcTransformMatrix(),
        ),
      );
      clip.setCoords();
    }
    object.set({
      scaleX: (object.scaleX ?? 1) * sx,
      scaleY: (object.scaleY ?? 1) * sy,
    });
    object.setPositionByOrigin(target, "center", "center");
    object.setCoords();
    object.dirty = true;
  };
  canvas
    .getObjects()
    .filter((o) => !isCartonGuide(o))
    .forEach((o) => adapt(o));
  if (canvas.backgroundImage && typeof canvas.backgroundImage !== "string")
    adapt(canvas.backgroundImage, true);
  if (canvas.overlayImage && typeof canvas.overlayImage !== "string")
    adapt(canvas.overlayImage, true);
  canvas.remove(...canvas.getObjects().filter(isCartonGuide));
  canvas.add(...guides);
  applyCartonBoundary(canvas, after);
  return { width: next.width * MM_TO_PX, height: next.height * MM_TO_PX };
}
