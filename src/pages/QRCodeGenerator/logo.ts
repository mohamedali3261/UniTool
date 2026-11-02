import QRCode from "qrcode";
export type QRLogo = { src: string; name: string };
export async function readLogo(file: File): Promise<QRLogo> {
  if (!["image/png", "image/jpeg", "image/webp"].includes(file.type))
    throw Error("LOGO_TYPE");
  if (file.size > 5 * 1024 * 1024) throw Error("LOGO_SIZE");
  const url = URL.createObjectURL(file);
  try {
    const image = await loadImage(url);
    if (
      image.naturalWidth * image.naturalHeight > 16_000_000 ||
      !image.naturalWidth ||
      !image.naturalHeight
    )
      throw Error("LOGO_PIXELS");
    const scale = Math.min(
        1,
        1024 / Math.max(image.naturalWidth, image.naturalHeight),
      ),
      canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw Error("CANVAS");
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    const bounds = alphaBounds(
      ctx.getImageData(0, 0, canvas.width, canvas.height).data,
      canvas.width,
      canvas.height,
    );
    if (!bounds) throw Error("LOGO_EMPTY");
    const cropped = document.createElement("canvas");
    cropped.width = bounds.width;
    cropped.height = bounds.height;
    const cropCtx = cropped.getContext("2d");
    if (!cropCtx) throw Error("CANVAS");
    cropCtx.drawImage(
      canvas,
      bounds.x,
      bounds.y,
      bounds.width,
      bounds.height,
      0,
      0,
      bounds.width,
      bounds.height,
    );
    return { src: cropped.toDataURL("image/png"), name: file.name };
  } finally {
    URL.revokeObjectURL(url);
  }
}
/** Trim only transparent margins; opaque white pixels are intentional artwork. */
export function alphaBounds(
  data: Uint8ClampedArray,
  width: number,
  height: number,
) {
  let x1 = width,
    y1 = height,
    x2 = -1,
    y2 = -1;
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++)
      if (data[(y * width + x) * 4 + 3] > 0) {
        x1 = Math.min(x1, x);
        y1 = Math.min(y1, y);
        x2 = Math.max(x2, x);
        y2 = Math.max(y2, y);
      }
  return x2 < 0
    ? null
    : { x: x1, y: y1, width: x2 - x1 + 1, height: y2 - y1 + 1 };
}
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(Error("LOGO_INVALID"));
    image.src = src;
  });
}
export function logoBox(width: number, height: number, percent: number) {
  const size =
      (Math.min(width, height) * Math.max(10, Math.min(30, percent))) / 100,
    padding = 0;
  return { size, padding, x: (width - size) / 2, y: (height - size) / 2 };
}
export type LogoPosition = "center" | "above" | "below";
export type LogoOptions = {
  position?: LogoPosition;
  background?: string | null;
};
export function logoLayout(
  size: number,
  percent: number,
  position: LogoPosition = "center",
) {
  const box = logoBox(size, size, percent),
    gap = Math.max(8, Math.round(size * 0.03));
  const extra = position === "center" ? 0 : Math.ceil(box.size) + gap;
  return {
    width: size,
    height: size + extra,
    qrY: position === "above" ? extra : 0,
    x: box.x,
    y: position === "above" ? 0 : position === "below" ? size + gap : box.y,
    size: box.size,
  };
}
export async function drawLogo(
  canvas: HTMLCanvasElement,
  logo: QRLogo | null,
  percent: number,
  options: LogoOptions = {},
) {
  if (!logo) return;
  const image = await loadImage(logo.src),
    layout = logoLayout(canvas.width, percent, options.position);
  if (layout.height !== canvas.height) {
    const original = document.createElement("canvas");
    original.width = canvas.width;
    original.height = canvas.height;
    original.getContext("2d")!.drawImage(canvas, 0, 0);
    canvas.height = layout.height;
    canvas.getContext("2d")!.drawImage(original, 0, layout.qrY);
  }
  const ctx = canvas.getContext("2d");
  if (!ctx) throw Error("CANVAS");
  if (options.background && /^#[0-9a-f]{6}$/i.test(options.background)) {
    ctx.fillStyle = options.background;
    ctx.fillRect(layout.x, layout.y, layout.size, layout.size);
  }
  const scale = Math.min(
      layout.size / image.naturalWidth,
      layout.size / image.naturalHeight,
    ),
    w = image.naturalWidth * scale,
    h = image.naturalHeight * scale;
  ctx.drawImage(
    image,
    layout.x + (layout.size - w) / 2,
    layout.y + (layout.size - h) / 2,
    w,
    h,
  );
}
/** QR paths stay vector; only the uploaded logo is embedded as a normalized PNG. */
export async function qrSvg(
  value: string,
  size: number,
  dark: string,
  light: string,
  logo: QRLogo | null,
  percent: number,
  options: LogoOptions = {},
) {
  const layout = logoLayout(size, percent, logo ? options.position : "center");
  const inner = await QRCode.toString(value, {
    type: "svg",
    width: size,
    margin: 4,
    color: { dark, light },
    errorCorrectionLevel: "H",
  });
  let overlay = "";
  if (logo) {
    const b = layout;
    overlay =
      (options.background && /^#[0-9a-f]{6}$/i.test(options.background)
        ? `<rect x="${b.x}" y="${b.y}" width="${b.size}" height="${b.size}" fill="${options.background}"/>`
        : "") +
      `<image x="${b.x}" y="${b.y}" width="${b.size}" height="${b.size}" preserveAspectRatio="xMidYMid meet" href="${logo.src}"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size + 32}" height="${layout.height + 55}" viewBox="0 0 ${size + 32} ${layout.height + 55}"><rect width="100%" height="100%" fill="#fff"/><g transform="translate(16 16)">${inner.replace(/<svg\b([^>]*)>/, (_, attrs: string) => `<svg x="0" y="${layout.qrY}" width="${size}" height="${size}" ${attrs.replace(/\s(?:width|height)="[^"]*"/g, "")}>`)}${overlay}</g><text x="${(size + 32) / 2}" y="${layout.height + 31}" text-anchor="middle" font-family="monospace" font-size="9" fill="#4b5563">Developed by Mohamed Ali</text><text x="${(size + 32) / 2}" y="${layout.height + 43}" text-anchor="middle" font-family="monospace" font-size="8" fill="#6b7280">www.unitool1.vercel.app</text></svg>`;
}
