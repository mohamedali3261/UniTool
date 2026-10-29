import type { EffectDefinition, EffectCategory, Frame } from "./types";
export type Painter = (ctx: CanvasRenderingContext2D, frame: Frame) => void;
/** Normalized coordinates, bounded geometry and deterministic time: previews and exports match. */
export function overlay(
  category: EffectCategory,
  id: string,
  name: string,
  description: string,
  paint: Painter,
): EffectDefinition {
  return {
    id,
    name,
    description,
    category,
    kind: "effect",
    overlay(ctx, f) {
      ctx.save();
      ctx.scale(f.w, f.h);
      ctx.globalAlpha *= f.amount;
      ctx.lineWidth = 0.002;
      paint(ctx, f);
      ctx.restore();
    },
  };
}
export const seed = (i: number) => {
  const n = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return n - Math.floor(n);
};
export const phase = (t: number, speed: number, i: number) =>
  (t * speed + seed(i)) % 1;
export function dot(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  color: string,
) {
  c.fillStyle = color;
  c.beginPath();
  c.arc(x, y, radius, 0, Math.PI * 2);
  c.fill();
}
export function line(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  x2: number,
  y2: number,
  color: string,
) {
  c.strokeStyle = color;
  c.beginPath();
  c.moveTo(x, y);
  c.lineTo(x2, y2);
  c.stroke();
}
export function glow(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  color: string,
) {
  const g = c.createRadialGradient(x, y, 0, x, y, radius);
  g.addColorStop(0, color);
  g.addColorStop(1, "transparent");
  c.fillStyle = g;
  c.fillRect(x - radius, y - radius, radius * 2, radius * 2);
}
