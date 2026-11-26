import { gradientFill } from "./materials";
import type { Layer } from "./model";
const images = new Map<string, HTMLImageElement>();
async function renderRawArtwork(
  layers: Layer[],
  size = 1024,
  height = size,
  viewport?: { x: number; y: number; w: number; h: number },
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(size / (viewport?.w ?? 1024), height / (viewport?.h ?? 1024));
  if (viewport) ctx.translate(-viewport.x, -viewport.y);
  artworkStats.rasterizations++;
  for (const l of layers) {
    if (!l.visible) continue;
    let img: HTMLImageElement | undefined;
    if (l.kind === "image" && l.src) {
      img = images.get(l.src);
      if (!img) {
        img = new Image();
        img.src = l.src;
        await img.decode();
        images.set(l.src, img);
        if (images.size > 16) images.delete(images.keys().next().value!);
      }
    }
    ctx.save();
    ctx.globalAlpha = l.opacity;
    ctx.translate(l.x + l.w / 2, l.y + l.h / 2);
    ctx.rotate((l.rotation * Math.PI) / 180);
    ctx.scale(l.flipX ? -1 : 1, l.flipY ? -1 : 1);
    if (
      l.kind === "image" &&
      ((l.brightness ?? 100) !== 100 ||
        (l.contrast ?? 100) !== 100 ||
        (l.saturation ?? 100) !== 100 ||
        (l.hue ?? 0) !== 0)
    )
      ctx.filter = `brightness(${l.brightness ?? 100}%) contrast(${l.contrast ?? 100}%) saturate(${l.saturation ?? 100}%) hue-rotate(${l.hue ?? 0}deg)`;
    ctx.shadowColor = "rgba(0,0,0,.6)";
    ctx.shadowBlur = l.shadow ?? 0;
    ctx.shadowOffsetY = (l.shadow ?? 0) / 3;
    ctx.fillStyle = l.gradient
      ? gradientFill(ctx, l.gradient, -l.w / 2, -l.h / 2, l.w, l.h)
      : l.color;
    if (l.kind === "image" && img) {
      const crop = l.crop ?? { x: 0, y: 0, w: 1, h: 1 };
      const sw = img.width * crop.w,
        sh = img.height * crop.h;
      const ratio = Math.min(l.w / sw, l.h / sh);
      ctx.drawImage(
        img,
        img.width * crop.x,
        img.height * crop.y,
        sw,
        sh,
        (-sw * ratio) / 2,
        (-sh * ratio) / 2,
        sw * ratio,
        sh * ratio,
      );
    }
    if (l.kind === "shape") {
      ctx.beginPath();
      if (l.shape === "circle")
        ctx.ellipse(0, 0, l.w / 2, l.h / 2, 0, 0, Math.PI * 2);
      else if (l.shape === "rect") ctx.rect(-l.w / 2, -l.h / 2, l.w, l.h);
      else if (l.shape === "triangle") {
        ctx.moveTo(0, -l.h / 2);
        ctx.lineTo(l.w / 2, l.h / 2);
        ctx.lineTo(-l.w / 2, l.h / 2);
        ctx.closePath();
      } else if (l.shape === "diamond") {
        ctx.moveTo(0, -l.h / 2);
        ctx.lineTo(l.w / 2, 0);
        ctx.lineTo(0, l.h / 2);
        ctx.lineTo(-l.w / 2, 0);
        ctx.closePath();
      } else if (l.shape === "line") {
        ctx.moveTo(-l.w / 2, 0);
        ctx.lineTo(l.w / 2, 0);
      } else {
        for (let i = 0; i < 10; i++) {
          const a = (i * Math.PI) / 5 - Math.PI / 2,
            r = i % 2 ? 0.42 : 1;
          const x = ((Math.cos(a) * l.w) / 2) * r,
            y = ((Math.sin(a) * l.h) / 2) * r;
          if (i) ctx.lineTo(x, y);
          else ctx.moveTo(x, y);
        }
        ctx.closePath();
      }
      if (l.outlineOnly || l.shape === "line") {
        ctx.strokeStyle = ctx.fillStyle;
        ctx.lineWidth = l.outline ?? 6;
        if (l.dashed) ctx.setLineDash([ctx.lineWidth * 3, ctx.lineWidth * 2]);
        ctx.stroke();
      } else ctx.fill();
    }
    if (l.kind === "text") {
      const lines = l.text.split("\n");
      const lineHeight = l.lineHeight ?? 1.12;
      ctx.letterSpacing = `${l.letterSpacing ?? 0}px`;
      let fontSize = Math.min(l.h / (lines.length * lineHeight), 400);
      ctx.font = `${l.italic ? "italic " : ""}${l.bold ? 800 : 400} ${fontSize}px ${l.font}`;
      const max = Math.max(...lines.map((t) => ctx.measureText(t).width), 1);
      fontSize *= Math.min(1, l.w / max);
      ctx.font = `${l.italic ? "italic " : ""}${l.bold ? 800 : 400} ${fontSize}px ${l.font}`;
      ctx.textAlign = l.align ?? "center";
      ctx.textBaseline = "middle";
      ctx.direction = /[\u0600-\u06ff]/.test(l.text) ? "rtl" : "ltr";
      ctx.strokeStyle = l.outlineColor ?? "#000000";
      ctx.lineWidth = l.outline ?? 0;
      ctx.lineJoin = "round";
      const paint = (text: string, x: number, y: number) => {
        if (l.outline) ctx.strokeText(text, x, y);
        ctx.fillText(text, x, y);
      };
      if (l.curve) {
        // Rasterize the complete shaped line first. Warping strips preserves
        // Arabic joining and ligatures instead of drawing isolated characters.
        const text = l.text.replaceAll("\n", " ");
        const measured = Math.max(1, ctx.measureText(text).width);
        const fitFont = Math.min(1, l.w / measured);
        fontSize *= fitFont;
        const font = `${l.italic ? "italic " : ""}${l.bold ? 800 : 400} ${fontSize}px ${l.font}`;
        ctx.font = font;
        const textWidth = Math.max(1, ctx.measureText(text).width),
          padding = (l.outline ?? 0) * 2 + 4;
        const source = document.createElement("canvas");
        source.width = Math.ceil(textWidth + padding * 2);
        source.height = Math.ceil(fontSize * 1.6 + padding * 2);
        const sc = source.getContext("2d")!;
        sc.font = font;
        sc.direction = ctx.direction;
        sc.textAlign = "center";
        sc.textBaseline = "middle";
        sc.fillStyle = l.gradient
          ? gradientFill(sc, l.gradient, 0, 0, source.width, source.height)
          : l.color;
        sc.letterSpacing = `${l.letterSpacing ?? 0}px`;
        sc.strokeStyle = l.outlineColor ?? "#000000";
        sc.lineWidth = l.outline ?? 0;
        sc.lineJoin = "round";
        if (l.outline) sc.strokeText(text, source.width / 2, source.height / 2);
        sc.fillText(text, source.width / 2, source.height / 2);
        const angle = (Math.abs(l.curve) * Math.PI) / 180,
          sign = Math.sign(l.curve),
          radius = textWidth / angle;
        const sag = radius * (1 - Math.cos(angle / 2));
        const warped = document.createElement("canvas");
        warped.width = Math.ceil(textWidth + source.height * 2);
        warped.height = Math.ceil(sag + source.height * 2);
        const wc = warped.getContext("2d")!;
        wc.translate(warped.width / 2, warped.height / 2 - (sign * sag) / 2);
        for (let x = 0; x < source.width; x += 2) {
          const theta = (x - source.width / 2) / radius;
          wc.save();
          wc.translate(
            Math.sin(theta) * radius,
            sign * (1 - Math.cos(theta)) * radius,
          );
          wc.rotate(sign * theta);
          wc.drawImage(
            source,
            x,
            0,
            Math.min(2, source.width - x),
            source.height,
            -1,
            -source.height / 2,
            2.5,
            source.height,
          );
          wc.restore();
        }
        const fit = Math.min(1, l.w / warped.width, l.h / warped.height);
        ctx.drawImage(
          warped,
          (-warped.width * fit) / 2,
          (-warped.height * fit) / 2,
          warped.width * fit,
          warped.height * fit,
        );
      } else
        lines.forEach((t, i) =>
          paint(
            t,
            l.align === "left" ? -l.w / 2 : l.align === "right" ? l.w / 2 : 0,
            (i - (lines.length - 1) / 2) * fontSize * lineHeight,
          ),
        );
    }
    ctx.restore();
  }
  return canvas;
}
export const artworkStats = { rasterizations: 0, composites: 0 };
export interface LayerRaster {
  canvas: HTMLCanvasElement;
  pad: number;
  w: number;
  h: number;
}
const rasters = new Map<
  string,
  { work: Promise<LayerRaster>; pixels: number }
>();
let cachedPixels = 0,
  fontEpoch = 0;
export function invalidateArtworkCache() {
  rasters.clear();
  cachedPixels = 0;
  fontEpoch++;
}
const sources = new Map<string, number>();
let nextSource = 0;
export function sourceToken(src: string) {
  if (!src) return 0;
  const token = sources.get(src);
  if (token !== undefined) return token;
  const id = ++nextSource;
  sources.set(src, id);
  if (sources.size > 128) sources.delete(sources.keys().next().value!);
  return id;
}
export function layerRasterKey(l: Layer, quality = 1) {
  const { id, name, x, y, rotation, opacity, locked, visible, src, ...style } =
    l;
  return JSON.stringify([fontEpoch, quality, sourceToken(src), style]);
}
export function getLayerRaster(l: Layer, quality = 1): Promise<LayerRaster> {
  const key = layerRasterKey(l, quality);
  const cached = rasters.get(key);
  if (cached) {
    rasters.delete(key);
    rasters.set(key, cached);
    return cached.work;
  }
  const pad = Math.ceil((l.shadow ?? 0) * 2 + (l.outline ?? 0) + 4),
    w = l.w + pad * 2,
    h = l.h + pad * 2;
  const width = Math.max(1, Math.ceil(w * quality)),
    height = Math.max(1, Math.ceil(h * quality));
  const pixels = width * height;
  const work = renderRawArtwork(
    [{ ...l, x: 0, y: 0, rotation: 0, opacity: 1, visible: true }],
    width,
    height,
    { x: -pad, y: -pad, w, h },
  ).then((canvas) => ({ canvas, pad, w, h }));
  if (pixels <= 16000000) {
    while (cachedPixels + pixels > 16000000 && rasters.size) {
      const first = rasters.keys().next().value!;
      cachedPixels -= rasters.get(first)!.pixels;
      rasters.delete(first);
    }
    rasters.set(key, { work, pixels });
    cachedPixels += pixels;
  }
  work.catch(() => {
    if (rasters.get(key)?.work === work) {
      cachedPixels -= pixels;
      rasters.delete(key);
    }
  });
  return work;
}
export async function drawArtwork(
  layers: Layer[],
  size = 1024,
  height = size,
): Promise<HTMLCanvasElement> {
  const c = document.createElement("canvas");
  c.width = size;
  c.height = height;
  const ctx = c.getContext("2d")!;
  ctx.scale(size / 1024, height / 1024);
  artworkStats.composites++;
  // Text shaping, filters and shadows are cached independently of transforms.
  for (const l of layers) {
    if (!l.visible) continue;
    const r = await getLayerRaster(l, Math.max(size, height) / 1024);
    ctx.save();
    ctx.globalAlpha = l.opacity;
    ctx.translate(l.x + l.w / 2, l.y + l.h / 2);
    ctx.rotate((l.rotation * Math.PI) / 180);
    ctx.drawImage(r.canvas, -l.w / 2 - r.pad, -l.h / 2 - r.pad, r.w, r.h);
    ctx.restore();
  }
  return c;
}
export async function rasterFile(file: File): Promise<string> {
  if (
    !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
    file.size > 10 * 1024 * 1024
  )
    throw new Error("اختر PNG أو JPG أو WebP بحجم أقل من 10MB");
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    const c = document.createElement("canvas");
    const ratio = Math.min(1, 2048 / Math.max(image.width, image.height));
    c.width = Math.max(1, Math.round(image.width * ratio));
    c.height = Math.max(1, Math.round(image.height * ratio));
    c.getContext("2d")!.drawImage(image, 0, 0, c.width, c.height);
    return file.type === "image/jpeg"
      ? c.toDataURL("image/jpeg", 0.92)
      : c.toDataURL("image/png");
  } finally {
    URL.revokeObjectURL(url);
  }
}
