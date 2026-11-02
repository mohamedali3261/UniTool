import type { LayerFrame, TextLayer } from "../types";
export const frame = (
  at: number,
  patch: Partial<LayerFrame> = {},
): LayerFrame => ({
  at,
  x: 0,
  y: 0,
  rotation: 0,
  scaleX: 1,
  scaleY: 1,
  opacity: 1,
  blur: 0,
  ...patch,
});
export function layerFrameAt(layer: TextLayer, time: number): LayerFrame {
  const frames = layer.frames;
  if (!frames?.length) return frame(0);
  const local = time - layer.start;
  const index = frames.findIndex((f) => f.at >= local);
  const a =
      index < 0 ? frames[frames.length - 1] : frames[Math.max(0, index - 1)],
    b = index < 0 ? a : frames[index];
  const t =
    a === b
      ? 0
      : Math.max(
          0,
          Math.min(1, (local - a.at) / Math.max(0.00001, b.at - a.at)),
        );
  const eased =
    b.easing === "spring"
      ? (1 - Math.exp(-6 * t) * Math.cos(10 * t)) /
        (1 - Math.exp(-6) * Math.cos(10))
      : b.easing === "smooth"
        ? t * t * (3 - 2 * t)
        : t;
  const out = frame(local);
  for (const key of [
    "x",
    "y",
    "rotation",
    "scaleX",
    "scaleY",
    "opacity",
    "blur",
  ] as const)
    out[key] = a[key] + (b[key] - a[key]) * eased;
  out.opacity = Math.max(0, Math.min(1, out.opacity));
  out.blur = Math.max(0, Math.min(24, out.blur));
  out.scaleX = Math.max(0.001, out.scaleX);
  out.scaleY = Math.max(0.001, out.scaleY);
  return out;
}
export function counterText(layer: TextLayer, time: number) {
  const c = layer.counter;
  if (!c) return layer.text;
  const t = Math.max(
    0,
    Math.min(1, (time - layer.start) / Math.max(0.01, c.duration)),
  );
  return (c.from + (c.to - c.from) * t).toFixed(c.decimals) + c.suffix;
}
export function validLayerAnimation(t: TextLayer): boolean {
  const num = (v: unknown, min: number, max: number) =>
    typeof v === "number" && Number.isFinite(v) && v >= min && v <= max;
  if (
    t.frames !== undefined &&
    (!Array.isArray(t.frames) ||
      t.frames.length > 120 ||
      t.frames.some(
        (f, i) =>
          !f ||
          !num(f.at, 0, 86400) ||
          (i > 0 && f.at <= t.frames![i - 1].at) ||
          !num(f.x, -200, 200) ||
          !num(f.y, -200, 200) ||
          !num(f.rotation, -720, 720) ||
          !num(f.scaleX, 0.001, 5) ||
          !num(f.scaleY, 0.001, 5) ||
          !num(f.opacity, 0, 1) ||
          !num(f.blur, 0, 24) ||
          (f.easing !== undefined &&
            !["linear", "smooth", "spring"].includes(f.easing)),
      ))
  )
    return false;
  const c = t.counter;
  if (
    c &&
    (!num(c.from, -1000000, 1000000) ||
      !num(c.to, -1000000, 1000000) ||
      !num(c.duration, 0.01, 86400) ||
      !Number.isInteger(c.decimals) ||
      !num(c.decimals, 0, 4) ||
      typeof c.suffix !== "string" ||
      c.suffix.length > 40)
  )
    return false;
  return t.counter === undefined || !!c;
}
