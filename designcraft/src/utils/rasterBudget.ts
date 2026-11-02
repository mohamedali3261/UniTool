/** Bound allocations before Fabric creates a second canvas/backing store. */
export function rasterWithinBudget(width: number, height: number, multiplier = 1, maxPixels = 40_000_000) {
  const w = Math.ceil(width * multiplier), h = Math.ceil(height * multiplier);
  return [width, height, multiplier, w, h].every(n => Number.isFinite(n) && n > 0)
    && w <= 16384 && h <= 16384 && w * h <= maxPixels;
}

export function deviceRasterBudget() {
  const mobile = typeof window !== 'undefined' && (window.innerWidth < 768 || window.matchMedia('(pointer: coarse)').matches);
  return mobile ? 12_000_000 : 40_000_000;
}
