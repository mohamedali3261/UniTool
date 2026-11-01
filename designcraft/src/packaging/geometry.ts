/** Nominal millimetre geometry; prototype before production. */
export interface CartonSize {
  width: number;
  height: number;
  depth: number;
  glue: number;
  tuck: number;
}
export const DEFAULT_CARTON: CartonSize = {
  width: 80,
  height: 120,
  depth: 35,
  glue: 12,
  tuck: 12,
};
export const MM_TO_PX = 96 / 25.4;
export const CUT_COLOR = "#5146a0",
  FOLD_COLOR = "#e16a7f";
export function cartonError(s: CartonSize): string | null {
  if (
    !s ||
    ![s.width, s.height, s.depth, s.glue, s.tuck].every(Number.isFinite)
  )
    return "finite";
  if (
    s.width < 20 ||
    s.width > 300 ||
    s.height < 30 ||
    s.height > 500 ||
    s.depth < 10 ||
    s.depth > 150
  )
    return "dimensions";
  if (s.glue < 5 || s.glue > Math.min(30, s.width * 0.4)) return "glue";
  if (s.tuck < 5 || s.tuck > Math.min(30, s.depth * 0.6, s.width * 0.25))
    return "tuck";
  return null;
}
export function cartonGeometry(s: CartonSize) {
  const error = cartonError(s);
  if (error) throw Error(`Invalid carton: ${error}`);
  const { width: w, height: h, depth: d, glue: g, tuck: t } = s;
  const x0 = 10,
    x1 = x0 + g,
    x2 = x1 + w,
    x3 = x2 + d,
    x4 = x3 + w,
    x5 = x4 + d,
    y0 = 10 + d + t,
    y1 = y0 + h;
  const q = Math.min(w * 0.45, d * 0.75, h * 0.4),
    i = Math.min(4, d * 0.12),
    b = Math.min(4, t * 0.3, w * 0.08),
    gc = Math.min(4, h * 0.1);
  const points = [
    [x0, y0 + gc],
    [x1, y0],
    [x1, y0 - d],
    [x1 + b, y0 - d - t],
    [x2 - b, y0 - d - t],
    [x2, y0 - d],
    [x2, y0],
    [x2 + i, y0 - q],
    [x3 - i, y0 - q],
    [x3, y0],
    [x4, y0],
    [x4 + i, y0 - q],
    [x5 - i, y0 - q],
    [x5, y0],
    [x5, y1],
    [x5 - i, y1 + q],
    [x4 + i, y1 + q],
    [x4, y1],
    [x4, y1 + d],
    [x4 - b, y1 + d + t],
    [x3 + b, y1 + d + t],
    [x3, y1 + d],
    [x3, y1],
    [x3 - i, y1 + q],
    [x2 + i, y1 + q],
    [x2, y1],
    [x1, y1],
    [x0, y1 - gc],
  ];
  const n = (v: number) => Number(v.toFixed(5));
  const cut =
    points.map(([x, y], j) => `${j ? "L" : "M"}${n(x)} ${n(y)}`).join(" ") +
    " Z";
  const folds: number[][] = [
    [x1, y0, x1, y1],
    [x2, y0, x2, y1],
    [x3, y0, x3, y1],
    [x4, y0, x4, y1],
    [x1, y0, x2, y0],
    [x1, y0 - d, x2, y0 - d],
    [x2, y0, x3, y0],
    [x4, y0, x5, y0],
    [x3, y1, x4, y1],
    [x3, y1 + d, x4, y1 + d],
    [x2, y1, x3, y1],
    [x4, y1, x5, y1],
  ];
  return {
    width: n(x5 + 10),
    height: n(y1 + d + t + 10),
    cut,
    folds,
    panels: [
      { x: x1, y: y0, width: w, height: h },
      { x: x2, y: y0, width: d, height: h },
      { x: x3, y: y0, width: w, height: h },
      { x: x4, y: y0, width: d, height: h },
    ],
  };
}
export function cartonSvg(s: CartonSize, dimensions = false) {
  const a = cartonGeometry(s),
    front = a.panels[0],
    side = a.panels[3];
  const labels = dimensions
    ? `<g fill="#374151" stroke="none" font-family="Arial,sans-serif" font-size="3" text-anchor="middle"><text x="${front.x + s.width / 2}" y="5">W ${s.width} mm</text><text x="${a.width - 4}" y="${front.y + s.height / 2}" transform="rotate(90 ${a.width - 4} ${front.y + s.height / 2})">L ${s.height} mm</text><text x="${side.x + s.depth / 2}" y="${a.height - 4}">D ${s.depth} mm</text></g>`
    : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" direction="ltr" width="${a.width}mm" height="${a.height}mm" viewBox="0 0 ${a.width} ${a.height}"><title>Carton L ${s.height} x W ${s.width} x D ${s.depth} mm</title><g id="cut" fill="none" stroke="${CUT_COLOR}" stroke-width="0.2" stroke-linejoin="round"><path d="${a.cut}"/></g><g id="fold" fill="none" stroke="${FOLD_COLOR}" stroke-width="0.2" stroke-dasharray="2 1">${a.folds.map(([x1, y1, x2, y2]) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`).join("")}</g>${labels}</svg>`;
}
export function paperFor(a: { width: number; height: number }) {
  const fits = (w: number, h: number) =>
    (a.width <= w && a.height <= h) || (a.height <= w && a.width <= h);
  return fits(210, 297) ? "A4" : fits(297, 420) ? "A3" : "custom";
}
