import type { SceneEntry } from "../composition/scene";
/** Operates on actual decoded neighboring clip frames in the shared preview/export compositor. */
export function clipTransitionMask(
  c: CanvasRenderingContext2D,
  entry: SceneEntry,
  w: number,
  h: number,
) {
  const reveal = entry.reveal;
  if (!reveal) return;
  const p = reveal.progress;
  if (reveal.kind === "circle-reveal") {
    c.beginPath();
    c.arc(w / 2, h / 2, (Math.hypot(w, h) / 2) * p, 0, Math.PI * 2);
    c.clip();
  }
  if (reveal.kind === "shared-card") {
    const x = w * 0.2 * (1 - p),
      y = h * 0.18 * (1 - p);
    c.beginPath();
    c.roundRect(x, y, w - 2 * x, h - 2 * y, Math.min(w, h) * 0.08 * (1 - p));
    c.clip();
  }
  if (reveal.kind === "liquid-wipe") {
    c.beginPath();
    c.moveTo(0, 0);
    const base = -w * 0.1 + p * w * 1.2;
    for (let y = 0; y <= h; y += h / 64)
      c.lineTo(
        base +
          Math.sin((y / h) * 18 + p * 8) * w * 0.04 * Math.sin(p * Math.PI),
        y,
      );
    c.lineTo(0, h);
    c.closePath();
    c.clip();
  }
  if (reveal.kind === "page-flip") {
    c.translate(w / 2, h / 2);
    c.scale(Math.max(0.001, Math.abs(Math.cos(p * Math.PI))), 1);
    c.translate(-w / 2, -h / 2);
  }
}
