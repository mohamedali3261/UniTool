import { withCartonPrecision } from "./precision";
import { fabric } from "fabric";
import { exportCanvasSvg } from "../utils/fabricHelpers";
import {
  cartonGeometry,
  MM_TO_PX,
  CUT_COLOR,
  FOLD_COLOR,
  type CartonSize,
} from "./geometry";
import { physicalCartonSvg } from "./physicalSvg";
import { isCartonGuide, applyCartonBoundary } from "./boundary";
import {
  assertPhysicalCanvas,
  pngWithDpi,
  printSpec,
  type PrintDpi,
} from "./printMath";
export function imagePreflight(canvas: fabric.Canvas, target = 300) {
  const images: { name: string; dpi: number }[] = [];
  const visit = (objects: fabric.Object[]) =>
    objects.forEach((o: any) => {
      if (o.visible === false || o.opacity === 0) return;
      if (o.type === "image") {
        const scale = o.getObjectScaling();
        const dpi =
          96 / Math.max(Math.abs(scale.scaleX), Math.abs(scale.scaleY), 1e-9);
        images.push({
          name: o.name || `Image ${images.length + 1}`,
          dpi: Math.floor(dpi),
        });
      }
      if (o.getObjects) visit(o.getObjects());
    });
  visit(canvas.getObjects());
  return { images, low: images.filter((o) => o.dpi < target) };
}
function withoutGuides<T>(
  canvas: fabric.Canvas,
  hide: boolean,
  render: () => T,
): T {
  const guides = canvas.getObjects().filter(isCartonGuide),
    visibility = guides.map((o) => o.visible);
  if (hide) guides.forEach((o) => (o.visible = false));
  try {
    return render();
  } finally {
    guides.forEach((o, i) => (o.visible = visibility[i]));
    canvas.requestRenderAll();
  }
}
async function pixels(
  canvas: fabric.Canvas,
  size: CartonSize,
  dpi: PrintDpi,
  guides: boolean,
) {
  const spec = printSpec(size, dpi),
    g = cartonGeometry(size);
  // A fresh, explicitly sized surface avoids viewport zoom/pan and backing-store rounding.
  const json = withCartonPrecision(() => canvas.toJSON(["id"]));
  if (!guides)
    json.objects = json.objects.filter(
      (o: any) => !String(o.id || "").startsWith("packaging-"),
    );
  const surface = new fabric.StaticCanvas(null, {
    width: spec.width,
    height: spec.height,
    enableRetinaScaling: false,
    renderOnAddRemove: false,
  });
  try {
    await new Promise<void>((resolve) =>
      surface.loadFromJSON(json, () => resolve()),
    );
    // Fabric 5 normally caps caches at ~2 MP, which would soften a 600-DPI
    // silhouette. This isolated surface is already bounded by printSpec's 40 MP
    // limit: keep its mask at the actual output resolution, not a stretched cache.
    if (surface.clipPath) {
      (surface.clipPath as any)._limitCacheSize = (dimensions: unknown) =>
        dimensions;
      surface.clipPath.dirty = true;
    }
    surface.setViewportTransform([
      spec.width / (g.width * MM_TO_PX),
      0,
      0,
      spec.height / (g.height * MM_TO_PX),
      0,
      0,
    ]);
    surface.renderAll();
    const data = surface.toDataURL({
      format: "png",
      multiplier: 1,
      enableRetinaScaling: false,
    });
    if (!data) throw Error("RENDER_FAILED");
    return pngWithDpi(
      Uint8Array.from(atob(data.split(",")[1]), (c) => c.charCodeAt(0)),
      dpi,
    );
  } finally {
    surface.dispose();
  }
}
export async function packagingPrint(
  canvas: fabric.Canvas,
  size: CartonSize,
  width: number,
  height: number,
  format: "pdf" | "png" | "svg",
  dpi: PrintDpi,
  guides: boolean,
): Promise<Blob> {
  assertPhysicalCanvas(size, width, height);
  applyCartonBoundary(canvas, size);
  const g = cartonGeometry(size);
  if (format === "svg") {
    // Always derive manufacturing guides from dimensions, never from movable artwork objects.
    let svg = withoutGuides(canvas, true, () =>
      physicalCartonSvg(
        withCartonPrecision(() => exportCanvasSvg(canvas, width, height)),
        size,
        width,
        height,
      ),
    );
    if (!svg) throw Error("RENDER_FAILED");
    if (guides) {
      const scale = MM_TO_PX;
      const guide = `<g transform="scale(${scale})" fill="none"><path d="${g.cut}" stroke="${CUT_COLOR}" stroke-width=".2"/>${g.folds.map(([x1, y1, x2, y2]) => `<path d="M${x1} ${y1}L${x2} ${y2}" stroke="${FOLD_COLOR}" stroke-width=".2" stroke-dasharray="2 1"/>`).join("")}</g>`;
      svg = svg.replace(/<\/svg>\s*$/, guide + "</svg>");
    }
    return new Blob([svg], { type: "image/svg+xml" });
  }
  const png = await pixels(canvas, size, dpi, format === "png" && guides);
  if (format === "png")
    return new Blob([new Uint8Array(png)], { type: "image/png" });
  const { PDFDocument, rgb } = await import("pdf-lib"),
    doc = await PDFDocument.create(),
    mm = 72 / 25.4,
    page = doc.addPage([g.width * mm, g.height * mm]),
    image = await doc.embedPng(png);
  page.drawImage(image, {
    x: 0,
    y: 0,
    width: g.width * mm,
    height: g.height * mm,
  });
  if (guides) {
    const color = (h: string) =>
      rgb(
        parseInt(h.slice(1, 3), 16) / 255,
        parseInt(h.slice(3, 5), 16) / 255,
        parseInt(h.slice(5, 7), 16) / 255,
      );
    page.drawSvgPath(g.cut, {
      x: 0,
      y: g.height * mm,
      scale: mm,
      borderWidth: 0.2,
      borderColor: color(CUT_COLOR),
    });
    for (const [x1, y1, x2, y2] of g.folds)
      page.drawLine({
        start: { x: x1 * mm, y: (g.height - y1) * mm },
        end: { x: x2 * mm, y: (g.height - y2) * mm },
        color: color(FOLD_COLOR),
        thickness: 0.2 * mm,
        dashArray: [2 * mm, mm],
      });
  }
  doc.setTitle("Carton artwork — actual size");
  doc.setSubject(
    `${dpi} DPI artwork; RGB; actual size 100%; nominal millimetres; prototype before production.`,
  );
  return new Blob([new Uint8Array(await doc.save())], {
    type: "application/pdf",
  });
}
