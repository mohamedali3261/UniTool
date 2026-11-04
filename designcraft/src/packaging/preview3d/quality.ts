export type PreviewQuality = "balanced" | "high";
export function previewTextureLimit(quality: PreviewQuality, mobile: boolean) {
  return quality === "high"
    ? { edge: 4096, pixels: mobile ? 8_000_000 : 16_000_000 }
    : { edge: 2048, pixels: 4_000_000 };
}
/** Independent edge/area budgets bound rectangular atlases as well as square ones. */
export function atlasPixelsPerMm(
  width: number,
  height: number,
  edge: number,
  maxPixels: number,
) {
  if (
    ![width, height, edge, maxPixels].every((n) => Number.isFinite(n) && n > 0)
  )
    throw Error("Invalid preview budget");
  return Math.min(
    edge / width,
    edge / height,
    Math.sqrt(maxPixels / (width * height)),
    32,
  );
}
