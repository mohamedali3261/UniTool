import type { Layer } from "./model";
export function resizeCorner(
  l: Layer,
  dx: number,
  dy: number,
  sx: number,
  sy: number,
) {
  const a = (l.rotation * Math.PI) / 180,
    c = Math.cos(a),
    s = Math.sin(a);
  let w = Math.max(20, Math.min(2048, l.w + sx * (dx * c + dy * s))),
    h = Math.max(20, Math.min(2048, l.h + sy * (-dx * s + dy * c)));
  if (l.lockRatio !== false) {
    const f = Math.max(
      20 / Math.min(l.w, l.h),
      Math.min(2048 / Math.max(l.w, l.h), w / l.w),
    );
    w = l.w * f;
    h = l.h * f;
  }
  const cx = l.x + l.w / 2 + (sx * (w - l.w) * c - sy * (h - l.h) * s) / 2,
    cy = l.y + l.h / 2 + (sx * (w - l.w) * s + sy * (h - l.h) * c) / 2;
  return { x: cx - w / 2, y: cy - h / 2, w, h };
}
