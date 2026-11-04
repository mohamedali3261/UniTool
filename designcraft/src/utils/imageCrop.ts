/** Crop in Fabric object-local pixels; never resample or overwrite source media. */
export type CropInsets = {
  cropTop: number;
  cropBottom: number;
  cropLeft: number;
  cropRight: number;
};
export function normalizeCrop(
  width: number,
  height: number,
  input: Partial<CropInsets>,
): CropInsets {
  const w = Math.max(1, Number.isFinite(width) ? width : 1),
    h = Math.max(1, Number.isFinite(height) ? height : 1);
  const clamp = (n: number | undefined, max: number) =>
    Math.max(0, Math.min(max, Number.isFinite(n) ? n! : 0));
  const cropLeft = clamp(input.cropLeft, w - 1),
    cropTop = clamp(input.cropTop, h - 1);
  return {
    cropLeft,
    cropTop,
    cropRight: clamp(input.cropRight, w - cropLeft - 1),
    cropBottom: clamp(input.cropBottom, h - cropTop - 1),
  };
}
export function ratioCrop(
  width: number,
  height: number,
  ratio: number,
): CropInsets {
  if (!Number.isFinite(ratio) || ratio <= 0)
    return normalizeCrop(width, height, {});
  const w = Math.min(width, height * ratio),
    h = w / ratio;
  return normalizeCrop(width, height, {
    cropLeft: (width - w) / 2,
    cropRight: (width - w) / 2,
    cropTop: (height - h) / 2,
    cropBottom: (height - h) / 2,
  });
}
export function moveCrop(
  width: number,
  height: number,
  crop: CropInsets,
  dx: number,
  dy: number,
): CropInsets {
  const c = normalizeCrop(width, height, crop),
    x = Math.max(-c.cropLeft, Math.min(c.cropRight, dx)),
    y = Math.max(-c.cropTop, Math.min(c.cropBottom, dy));
  return {
    ...c,
    cropLeft: c.cropLeft + x,
    cropRight: c.cropRight - x,
    cropTop: c.cropTop + y,
    cropBottom: c.cropBottom - y,
  };
}
