export const clamp = (v: number) => Math.max(0, Math.min(1, v));
export const ease = (v: number) => 1 - Math.pow(1 - clamp(v), 3);
export function panel(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  fill = "#101f23",
  stroke = "#ffffff18",
  r = 18,
) {
  c.fillStyle = fill;
  c.strokeStyle = stroke;
  c.lineWidth = 1;
  c.beginPath();
  c.roundRect(x, y, w, h, r);
  c.fill();
  c.stroke();
}
export function text(
  c: CanvasRenderingContext2D,
  s: string,
  x: number,
  y: number,
  size = 22,
  color = "#e5f3ee",
  align: CanvasTextAlign = "left",
  mono = false,
) {
  c.fillStyle = color;
  c.font = `${mono ? 500 : 700} ${size}px ${mono ? "monospace" : "Arial, sans-serif"}`;
  c.textAlign = align;
  c.textBaseline = "middle";
  c.direction = align === "right" ? "rtl" : "ltr";
  c.fillText(s, x, y);
}
export function line(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  color = "#ffffff20",
) {
  c.fillStyle = color;
  c.fillRect(x, y, w, 2);
}
export function windowFrame(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
) {
  panel(c, x, y, w, h);
  for (let i = 0; i < 3; i++) {
    c.fillStyle = ["#fc8b8b", "#edce7f", "#68cfa7"][i];
    c.beginPath();
    c.arc(x + 22 + i * 17, y + 22, 4, 0, Math.PI * 2);
    c.fill();
  }
  text(c, label, x + w - 18, y + 22, 14, "#849e9e", "right", true);
  line(c, x, y + 44, w);
}
export function cursor(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  click: number,
  accent: string,
) {
  c.save();
  c.translate(x, y);
  if (click > 0) {
    c.globalAlpha = clamp(1 - click);
    c.strokeStyle = accent;
    c.lineWidth = 2;
    c.beginPath();
    c.arc(0, 0, 10 + click * 35, 0, Math.PI * 2);
    c.stroke();
    c.globalAlpha = 1;
  }
  c.beginPath();
  c.moveTo(0, 0);
  c.lineTo(3, 29);
  c.lineTo(11, 20);
  c.lineTo(18, 33);
  c.lineTo(25, 29);
  c.lineTo(17, 17);
  c.lineTo(30, 16);
  c.closePath();
  c.fillStyle = "#f3fffc";
  c.strokeStyle = "#061916";
  c.lineWidth = 3;
  c.fill();
  c.stroke();
  c.restore();
}
export function reveal(
  c: CanvasRenderingContext2D,
  t: number,
  delay: number,
  fn: () => void,
) {
  const a = ease((t - delay) / 0.7);
  c.save();
  c.globalAlpha *= a;
  c.translate(0, (1 - a) * 22);
  fn();
  c.restore();
}
export function code(
  c: CanvasRenderingContext2D,
  lines: string[],
  x: number,
  y: number,
  t: number,
  accent: string,
) {
  let budget = Math.floor(Math.max(0, t) * 22);
  for (const [i, s] of lines.entries()) {
    const shown = s.slice(0, Math.max(0, budget));
    budget -= s.length;
    text(
      c,
      String(i + 1).padStart(2, "0"),
      x,
      y + i * 38,
      16,
      "#506769",
      "left",
      true,
    );
    text(
      c,
      shown,
      x + 43,
      y + i * 38,
      20,
      i % 2 ? "#d7d6ff" : accent,
      "left",
      true,
    );
  }
  if (Math.floor(t * 2) % 2 === 0) {
    const len = lines.reduce((n, s) => n + s.length, 0);
    if (budget < len)
      text(
        c,
        "▍",
        x + 47,
        y +
          Math.min(lines.length - 1, Math.floor((Math.max(0, t) * 22) / 32)) *
            38,
        20,
        accent,
      );
  }
}
