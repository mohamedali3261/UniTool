import { atlasPixelsPerMm } from "./quality";
import { fabric } from "fabric";
import { EXTRA_PROPS } from "../../advanced/core/text";
import { withCartonPrecision } from "../precision";
import { cartonGeometry, MM_TO_PX, type CartonSize } from "../geometry";
import { assertPhysicalCanvas } from "../printMath";
/** Isolated, bounded artwork snapshot: no editor viewport, guide strokes, or saved raster copy. */
export async function cartonAtlas(
  canvas: fabric.Canvas,
  size: CartonSize,
  width: number,
  height: number,
  maxEdge = 2048,
  maxPixels = 16_000_000,
) {
  assertPhysicalCanvas(size, width, height);
  const g = cartonGeometry(size);
  // Bounded screen-only supersampling; never change original artwork or print dimensions.
  const atlasScale = atlasPixelsPerMm(g.width, g.height, maxEdge, maxPixels);
  const json = withCartonPrecision(() => canvas.toJSON(EXTRA_PROPS));
  json.objects = json.objects.filter(
    (o: any) => !String(o.id || "").startsWith("packaging-"),
  );
  const surface = new fabric.StaticCanvas(null, {
    width: Math.min(maxEdge, Math.max(1, Math.floor(g.width * atlasScale))),
    height: Math.min(maxEdge, Math.max(1, Math.floor(g.height * atlasScale))),
    enableRetinaScaling: false,
    renderOnAddRemove: false,
  });
  try {
    await new Promise<void>((resolve) =>
      surface.loadFromJSON(json, () => resolve()),
    );
    surface.setViewportTransform([
      atlasScale / MM_TO_PX,
      0,
      0,
      atlasScale / MM_TO_PX,
      0,
      0,
    ]);
    if (surface.clipPath) {
      (surface.clipPath as any)._limitCacheSize = (dimensions: unknown) =>
        dimensions;
      surface.clipPath.dirty = true;
    }
    surface
      .getObjects()
      .forEach((object) => object.set("objectCaching", false));
    surface.renderAll();
    const image = surface.getElement();
    // WebGL textures require an origin-clean source. Fail clearly rather than render a blank box.
    image.getContext("2d")!.getImageData(0, 0, 1, 1);
    return {
      surface,
      image,
      geometry: g,
      pixelsPerMm: atlasScale,
      dispose: () => surface.dispose(),
    };
  } catch (error) {
    surface.dispose();
    throw error;
  }
}
