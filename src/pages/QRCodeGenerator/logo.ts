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
    return { src: canvas.toDataURL("image/png"), name: file.name };
  } finally {
    URL.revokeObjectURL(url);
  }
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
      (Math.min(width, height) * Math.max(10, Math.min(20, percent))) / 100,
    padding = Math.min(width, height) * 0.02;
  return { size, padding, x: (width - size) / 2, y: (height - size) / 2 };
}
export async function drawLogo(
  canvas: HTMLCanvasElement,
  logo: QRLogo | null,
  percent: number,
) {
  if (!logo) return;
  const image = await loadImage(logo.src),
    ctx = canvas.getContext("2d");
  if (!ctx) throw Error("CANVAS");
  const b = logoBox(canvas.width, canvas.height, percent),
    scale = Math.min(b.size / image.naturalWidth, b.size / image.naturalHeight),
    w = image.naturalWidth * scale,
    h = image.naturalHeight * scale;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(
    b.x - b.padding,
    b.y - b.padding,
    b.size + 2 * b.padding,
    b.size + 2 * b.padding,
  );
  ctx.drawImage(image, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
}
/** QR paths stay vector; only the uploaded logo is embedded as a normalized PNG. */
export async function qrSvg(
  value: string,
  size: number,
  dark: string,
  light: string,
  logo: QRLogo | null,
  percent: number,
) {
  const inner = await QRCode.toString(value, {
    type: "svg",
    width: size,
    margin: 4,
    color: { dark, light },
    errorCorrectionLevel: "H",
  });
  let overlay = "";
  if (logo) {
    const b = logoBox(size, size, percent);
    overlay = `<rect x="${b.x - b.padding}" y="${b.y - b.padding}" width="${b.size + 2 * b.padding}" height="${b.size + 2 * b.padding}" fill="#fff"/><image x="${b.x}" y="${b.y}" width="${b.size}" height="${b.size}" preserveAspectRatio="xMidYMid meet" href="${logo.src}"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size + 32}" height="${size + 55}" viewBox="0 0 ${size + 32} ${size + 55}"><rect width="100%" height="100%" fill="#fff"/><g transform="translate(16 16)">${inner.replace(/<svg\b([^>]*)>/, (_, attrs: string) => `<svg x="0" y="0" width="${size}" height="${size}" ${attrs.replace(/\s(?:width|height)="[^"]*"/g, "")}>`)}${overlay}</g><text x="${(size + 32) / 2}" y="${size + 31}" text-anchor="middle" font-family="monospace" font-size="9" fill="#4b5563">Developed by Mohamed Ali</text><text x="${(size + 32) / 2}" y="${size + 43}" text-anchor="middle" font-family="monospace" font-size="8" fill="#6b7280">www.unitool1.vercel.app</text></svg>`;
}
