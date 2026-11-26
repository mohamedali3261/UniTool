import type { CropRect } from "./crop";
/** Exact runs on a thresholded mask: genuine vector paths, no embedded bitmap or URLs. */
export function traceMask(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  threshold = 160,
) {
  const runs: string[] = [];
  const ink = (x: number, y: number) => {
    const i = (y * width + x) * 4;
    return (
      data[i + 3] >= 128 &&
      0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2] < threshold
    );
  };
  for (let y = 0; y < height; y++) {
    let x = 0;
    while (x < width) {
      if (!ink(x, y)) {
        x++;
        continue;
      }
      const start = x;
      while (x < width && ink(x, y)) x++;
      const w = x - start;
      runs.push(`M${start} ${y}h${w}v1h-${w}z`);
    }
  }
  return runs.join("");
}
export async function traceRasterToSvg(
  src: string,
  color: string,
  threshold = 160,
  crop?: CropRect,
) {
  if (!/^#[0-9a-f]{6}$/i.test(color)) throw Error("Invalid color");
  const image = new Image();
  image.src = src;
  await image.decode();
  const bounds = crop ?? { x: 0, y: 0, w: 1, h: 1 },
    sw = image.width * bounds.w,
    sh = image.height * bounds.h,
    scale = Math.min(1, 512 / Math.max(sw, sh));
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(sw * scale));
  c.height = Math.max(1, Math.round(sh * scale));
  const ctx = c.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(
    image,
    image.width * bounds.x,
    image.height * bounds.y,
    sw,
    sh,
    0,
    0,
    c.width,
    c.height,
  );
  const path = traceMask(
    ctx.getImageData(0, 0, c.width, c.height).data,
    c.width,
    c.height,
    Math.max(0, Math.min(255, threshold)),
  );
  if (!path) throw Error("No dark opaque pixels at this threshold");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${c.width} ${c.height}" width="${c.width}" height="${c.height}"><path fill="${color}" d="${path}"/></svg>`;
}
