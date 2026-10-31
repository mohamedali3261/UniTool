import { drawTextLayers } from "../../../../video-studio/src/text/render";
import { textLayout } from "../../../../video-studio/src/text/layout";
import { drawInterfaceScene } from "../../../../video-studio/src/templates/interface-flow/render";
import type { LibraryElement } from "../types";
export function fittedLayer(item: LibraryElement, color?: string) {
  const layer = structuredClone(item.layer!);
  const ctx = document.createElement("canvas").getContext("2d")!;
  const layout = textLayout(ctx, layer, 960);
  const scale = Math.min(
    760 / Math.max(1, layout.width),
    370 / Math.max(1, layout.height),
    1.8,
  );
  layer.x = 50;
  layer.y = 50;
  layer.start = 0;
  layer.end = 8;
  layer.size = Math.max(12, Math.min(180, layer.size * scale));
  if (layer.box) {
    layer.box.width *= scale;
    layer.box.height *= scale;
    if (layer.box.radius) layer.box.radius *= scale;
    if (layer.box.borderWidth) layer.box.borderWidth *= scale;
  }
  if (color) {
    layer.color = color;
    if (layer.background) layer.background = color;
    if (layer.box?.borderColor) layer.box.borderColor = color;
  }
  return layer;
}
export function renderElement(
  canvas: HTMLCanvasElement,
  item: LibraryElement,
  time = 1.2,
  color?: string,
  image?: HTMLImageElement,
) {
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  if (item.kind === "layer") {
    drawTextLayers(ctx, [fittedLayer(item, color)], time);
  }
  if (item.kind === "scene") {
    const scale = Math.min(canvas.width / 720, canvas.height / 1280);
    ctx.translate((canvas.width - 720 * scale) / 2, 0);
    ctx.scale(scale, scale);
    ctx.fillStyle = "#071013";
    ctx.fillRect(0, 0, 720, 1280);
    drawInterfaceScene(ctx, item.scene!, time, color || "#4bdfc5");
  }
  if (item.kind === "svg" && image) {
    const scale = Math.min(
      canvas.width / image.naturalWidth,
      canvas.height / image.naturalHeight,
    );
    ctx.drawImage(
      image,
      (canvas.width - image.naturalWidth * scale) / 2,
      (canvas.height - image.naturalHeight * scale) / 2,
      image.naturalWidth * scale,
      image.naturalHeight * scale,
    );
  }
  ctx.restore();
}
