export interface CropRect {
  x: number;
  y: number;
  w: number;
  h: number;
}
export const fullCrop: CropRect = { x: 0, y: 0, w: 1, h: 1 };
const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n));
export function moveCrop(c: CropRect, dx: number, dy: number): CropRect {
  return {
    ...c,
    x: clamp(c.x + dx, 0, 1 - c.w),
    y: clamp(c.y + dy, 0, 1 - c.h),
  };
}
export function resizeCrop(
  c: CropRect,
  dx: number,
  dy: number,
  sx: number,
  sy: number,
): CropRect {
  let left = c.x,
    right = c.x + c.w,
    top = c.y,
    bottom = c.y + c.h;
  if (sx < 0) left = clamp(left + dx, 0, right - 0.01);
  if (sx > 0) right = clamp(right + dx, left + 0.01, 1);
  if (sy < 0) top = clamp(top + dy, 0, bottom - 0.01);
  if (sy > 0) bottom = clamp(bottom + dy, top + 0.01, 1);
  return { x: left, y: top, w: right - left, h: bottom - top };
}
export function aspectCrop(
  width: number,
  height: number,
  aspect: number,
): CropRect {
  let w = 1,
    h = width / (height * aspect);
  if (h > 1) {
    h = 1;
    w = (height * aspect) / width;
  }
  return { x: (1 - w) / 2, y: (1 - h) / 2, w, h };
}
export function alphaCrop(
  data: Uint8ClampedArray,
  width: number,
  height: number,
): CropRect {
  let left = width,
    top = height,
    right = -1,
    bottom = -1;
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++)
      if (data[(y * width + x) * 4 + 3] > 0) {
        left = Math.min(left, x);
        right = Math.max(right, x);
        top = Math.min(top, y);
        bottom = Math.max(bottom, y);
      }
  if (right < left) throw Error("Image is fully transparent");
  return {
    x: left / width,
    y: top / height,
    w: (right - left + 1) / width,
    h: (bottom - top + 1) / height,
  };
}
