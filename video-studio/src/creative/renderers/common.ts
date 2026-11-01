export type C = CanvasRenderingContext2D;
export const clamp = (x: number) => Math.max(0, Math.min(1, x));
export const ease = (x: number) => {
  x = clamp(x);
  return x * x * (3 - 2 * x);
};
export const noise = (n: number) => {
  const v = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return v - Math.floor(v);
};
export const spring = (x: number) =>
  1 - Math.exp(-7 * Math.max(0, x)) * Math.cos(12 * x);
export function card(
  c: C,
  x: number,
  y: number,
  w: number,
  h: number,
  color = "#132939",
  r = 22,
) {
  c.fillStyle = color;
  c.beginPath();
  c.roundRect(x, y, w, h, r);
  c.fill();
}
export function label(
  c: C,
  s: string,
  x: number,
  y: number,
  size = 28,
  color = "#fff",
) {
  c.font = `600 ${size}px Arial,sans-serif`;
  c.textAlign = "center";
  c.textBaseline = "middle";
  c.direction = /[\u0600-\u06ff]/.test(s) ? "rtl" : "ltr";
  c.fillStyle = color;
  c.fillText(s, x, y, 850);
}
export function dot(c: C, x: number, y: number, r: number, color: string) {
  c.fillStyle = color;
  c.beginPath();
  c.arc(x, y, Math.max(0.1, r), 0, Math.PI * 2);
  c.fill();
}
export function line(c: C, points: number[][], color: string, width = 4) {
  if (!points.length) return;
  c.beginPath();
  c.moveTo(points[0][0], points[0][1]);
  points.slice(1).forEach((p) => c.lineTo(p[0], p[1]));
  c.strokeStyle = color;
  c.lineWidth = width;
  c.lineCap = "round";
  c.stroke();
}
