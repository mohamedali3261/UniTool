import type { Project } from "./model";
import { drawArtwork } from "./artwork";
export interface Point {
  x: number;
  y: number;
}
export interface TryOnSettings {
  source: "man" | "custom";
  photo: string;
  mask: Point[];
  quad: Point[];
  tint: boolean;
  strength: number;
}
export const models = {
  man: {
    url: new URL("../assets/model-man.jpg", import.meta.url).href,
    ar: "عارض 01",
    en: "Model 01",
    mask: [
      [0.274, 0.298],
      [0.416, 0.249],
      [0.437, 0.282],
      [0.49, 0.296],
      [0.55, 0.287],
      [0.583, 0.249],
      [0.718, 0.297],
      [0.752, 0.342],
      [0.795, 0.462],
      [0.681, 0.484],
      [0.675, 0.451],
      [0.697, 0.779],
      [0.6, 0.785],
      [0.39, 0.785],
      [0.286, 0.778],
      [0.322, 0.462],
      [0.313, 0.486],
      [0.198, 0.468],
      [0.231, 0.366],
    ],
  },
};
export function defaultTryOn(source: "man" = "man"): TryOnSettings {
  return {
    source,
    photo: "",
    mask: models[source].mask.map(([x, y]) => ({ x, y })),
    quad: [
      { x: 0.337, y: 0.333 },
      { x: 0.658, y: 0.333 },
      { x: 0.667, y: 0.633 },
      { x: 0.326, y: 0.633 },
    ],
    tint: true,
    strength: 0.85,
  };
}
export function validPoint(p: unknown): p is Point {
  const a = p as Point;
  return (
    !!a &&
    Number.isFinite(a.x) &&
    Number.isFinite(a.y) &&
    a.x >= 0 &&
    a.x <= 1 &&
    a.y >= 0 &&
    a.y <= 1
  );
}
export function quadArea(quad: Point[]) {
  return (
    Math.abs(
      quad.reduce((s, p, i) => {
        const q = quad[(i + 1) % quad.length];
        return s + p.x * q.y - q.x * p.y;
      }, 0),
    ) / 2
  );
}
/** Reject crossing and collapsed quads before rendering rather than stretching pixels to infinity. */
export function validQuad(q: Point[]) {
  if (q.length !== 4 || !q.every(validPoint) || quadArea(q) < 0.0005)
    return false;
  const cross = q.map((p, i) => {
    const b = q[(i + 1) % 4],
      c = q[(i + 2) % 4];
    return (b.x - p.x) * (c.y - b.y) - (b.y - p.y) * (c.x - b.x);
  });
  return cross.every((x) => x > 1e-5) || cross.every((x) => x < -1e-5);
}
export function validateTryOn(t: TryOnSettings) {
  return (
    !!t &&
    ["man", "custom"].includes(t.source) &&
    typeof t.photo === "string" &&
    t.photo.length <= 15000000 &&
    (!t.photo || /^data:image\/(png|jpeg|webp);base64,/.test(t.photo)) &&
    Array.isArray(t.mask) &&
    t.mask.length >= 3 &&
    t.mask.length <= 40 &&
    t.mask.every(validPoint) &&
    Array.isArray(t.quad) &&
    validQuad(t.quad) &&
    typeof t.tint === "boolean" &&
    Number.isFinite(t.strength) &&
    t.strength >= 0 &&
    t.strength <= 1 &&
    (t.source !== "custom" || !!t.photo)
  );
}
export function bilinear(q: Point[], u: number, v: number): Point {
  return {
    x:
      (1 - v) * ((1 - u) * q[0].x + u * q[1].x) +
      v * ((1 - u) * q[3].x + u * q[2].x),
    y:
      (1 - v) * ((1 - u) * q[0].y + u * q[1].y) +
      v * ((1 - u) * q[3].y + u * q[2].y),
  };
}
const photos = new Map<string, HTMLImageElement>();
async function getPhoto(src: string) {
  let image = photos.get(src);
  if (!image) {
    image = new Image();
    image.src = src;
    await image.decode();
    photos.set(src, image);
    if (photos.size > 4) photos.delete(photos.keys().next().value!);
  }
  return image;
}
function triangle(
  ctx: CanvasRenderingContext2D,
  source: HTMLCanvasElement,
  s: Point[],
  d: Point[],
) {
  const [a, b, c] = s,
    [p, q, r] = d;
  const det = a.x * (b.y - c.y) + b.x * (c.y - a.y) + c.x * (a.y - b.y);
  if (Math.abs(det) < 1e-8) return;
  const calc = (k: "x" | "y") => [
    (p[k] * (b.y - c.y) + q[k] * (c.y - a.y) + r[k] * (a.y - b.y)) / det,
    (p[k] * (c.x - b.x) + q[k] * (a.x - c.x) + r[k] * (b.x - a.x)) / det,
    (p[k] * (b.x * c.y - c.x * b.y) +
      q[k] * (c.x * a.y - a.x * c.y) +
      r[k] * (a.x * b.y - b.x * a.y)) /
      det,
  ];
  const x = calc("x"),
    y = calc("y");
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(p.x, p.y);
  ctx.lineTo(q.x, q.y);
  ctx.lineTo(r.x, r.y);
  ctx.closePath();
  ctx.clip();
  ctx.setTransform(x[0], y[0], x[1], y[1], x[2], y[2]);
  ctx.drawImage(source, 0, 0);
  ctx.restore();
}
export async function renderTryOn(
  project: Project,
  size = 1024,
  original = false,
): Promise<HTMLCanvasElement> {
  const t = project.tryOn;
  if (!validateTryOn(t)) throw new Error("Invalid try-on settings");
  const image = await getPhoto(
    t.source === "custom" ? t.photo : models[t.source].url,
  );
  const canvas = document.createElement("canvas");
  canvas.height = size;
  canvas.width = Math.round(size * 0.75);
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.fillStyle = "#e4e2dc";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const ratio = Math.min(
      canvas.width / image.width,
      canvas.height / image.height,
    ),
    w = image.width * ratio,
    h = image.height * ratio;
  ctx.drawImage(image, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
  if (original) return canvas;
  const photo = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const maskPath = () => {
    ctx.beginPath();
    t.mask.forEach((p, i) =>
      i
        ? ctx.lineTo(p.x * canvas.width, p.y * canvas.height)
        : ctx.moveTo(p.x * canvas.width, p.y * canvas.height),
    );
    ctx.closePath();
  };
  if (t.tint) {
    ctx.save();
    maskPath();
    ctx.clip();
    ctx.globalCompositeOperation = "multiply";
    ctx.globalAlpha = t.strength;
    ctx.fillStyle = project.color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
  }
  const art = await drawArtwork(project.sides.front, Math.min(size, 2048)),
    print = document.createElement("canvas");
  print.width = canvas.width;
  print.height = canvas.height;
  const pctx = print.getContext("2d", { willReadFrequently: true })!;
  const grid = 12,
    q = t.quad.map((p) => ({ x: p.x * canvas.width, y: p.y * canvas.height }));
  for (let y = 0; y < grid; y++)
    for (let x = 0; x < grid; x++) {
      const uv = [
          { x: x / grid, y: y / grid },
          { x: (x + 1) / grid, y: y / grid },
          { x: (x + 1) / grid, y: (y + 1) / grid },
          { x: x / grid, y: (y + 1) / grid },
        ],
        dest = uv.map((p) => bilinear(q, p.x, p.y)),
        src = uv.map((p) => ({ x: p.x * art.width, y: p.y * art.height }));
      triangle(
        pctx,
        art,
        [src[0], src[1], src[2]],
        [dest[0], dest[1], dest[2]],
      );
      triangle(
        pctx,
        art,
        [src[0], src[2], src[3]],
        [dest[0], dest[2], dest[3]],
      );
    }
  const pixels = pctx.getImageData(0, 0, print.width, print.height);
  for (let i = 0; i < pixels.data.length; i += 4) {
    if (!pixels.data[i + 3]) continue;
    const brightness =
      (photo.data[i] * 0.2126 +
        photo.data[i + 1] * 0.7152 +
        photo.data[i + 2] * 0.0722) /
      235;
    const shade = Math.max(0.25, Math.min(1.08, brightness));
    for (let k = 0; k < 3; k++) pixels.data[i + k] *= shade;
  }
  pctx.putImageData(pixels, 0, 0);
  ctx.save();
  maskPath();
  ctx.clip();
  ctx.drawImage(print, 0, 0);
  ctx.restore();
  return canvas;
}
