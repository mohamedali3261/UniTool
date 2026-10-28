import { effectById } from "./registry";
import type { Frame } from "./types";
export function effectFrame(
  id: string | undefined,
  w: number,
  h: number,
  seconds: number,
  progress: number,
  intensity = 1,
  speed = 1,
) {
  const definition = id ? effectById.get(id) : undefined;
  const frame: Frame = {
    w,
    h,
    t: Math.max(0, seconds) * speed,
    progress: Math.min(1, Math.max(0, progress) * speed),
    amount: Math.min(1, Math.max(0, intensity)),
  };
  return {
    definition,
    frame,
    camera: frame.amount ? definition?.camera?.(frame) || {} : {},
  };
}
export function drawEffectOverlay(
  ctx: CanvasRenderingContext2D,
  e: ReturnType<typeof effectFrame>,
) {
  if (!e.definition?.overlay || !e.frame.amount) return;
  ctx.save();
  try {
    e.definition.overlay(ctx, e.frame);
  } finally {
    ctx.restore();
  }
}
