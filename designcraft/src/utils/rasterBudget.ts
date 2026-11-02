/** Bound allocations before Fabric creates a second canvas/backing store. */
export function rasterWithinBudget(width: number, height: number, multiplier = 1) {
  const w = Math.ceil(width * multiplier), h = Math.ceil(height * multiplier);
  return [width, height, multiplier, w, h].every(n => Number.isFinite(n) && n > 0)
    && w <= 16384 && h <= 16384 && w * h <= 40_000_000;
}
