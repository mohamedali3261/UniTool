import { card, dot, label, noise, clamp, type C } from "./common";
let backdrop: HTMLCanvasElement | undefined;
export function drawBackground(
  c: C,
  id: string,
  t: number,
  color: string,
  text: string,
  px: number,
  py: number,
  strength: number,
) {
  const alpha = c.globalAlpha;
  if (id === "glass") {
    c.translate(Math.sin(t * 0.6) * 12, Math.cos(t * 0.4) * 8);
    backdrop ||= document.createElement("canvas");
    backdrop.width = c.canvas.width;
    backdrop.height = c.canvas.height;
    backdrop.getContext("2d")!.drawImage(c.canvas, 0, 0);
    c.save();
    c.beginPath();
    c.roundRect(150, 125, 660, 290, 32);
    c.clip();
    c.save();
    const transform = c.getTransform();
    const blur = 14 * Math.hypot(transform.a, transform.b);
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.filter = `blur(${blur}px)`;
    c.drawImage(backdrop, 0, 0);
    c.restore();
    c.fillStyle = "#ffffff22";
    c.fillRect(150, 125, 660, 290);
    c.restore();
    c.strokeStyle = "#ffffff88";
    c.lineWidth = 2;
    c.strokeRect(165, 140, 630, 260);
    label(c, text, 480, 250, 40);
    label(c, "GLASS / BACKDROP", 480, 310, 18, color);
    return;
  }
  if (id !== "grain") {
    c.fillStyle = "#07131d";
    c.fillRect(0, 0, 960, 540);
  }
  if (id === "blob") {
    for (let layer = 0; layer < 3; layer++) {
      c.beginPath();
      for (let i = 0; i <= 100; i++) {
        const a = (i / 100) * Math.PI * 2,
          r =
            125 +
            35 * Math.sin(a * 3 + t * 0.7 + layer) +
            20 * Math.cos(a * 5 - t * 0.4);
        const x = 480 + Math.cos(a) * r * 1.5 + Math.sin(t * 0.3 + layer) * 170,
          y = 270 + Math.sin(a) * r;
        i ? c.lineTo(x, y) : c.moveTo(x, y);
      }
      c.closePath();
      c.fillStyle = [color, "#8a6ff055", "#37b4e855"][layer];
      c.globalAlpha = alpha * clamp(layer ? 0.55 : 0.75);
      c.fill();
    }
    c.globalAlpha = alpha;
  } else if (id === "mesh") {
    for (let i = 0; i < 5; i++) {
      const x = 480 + Math.sin(t * 0.25 + i * 2.1) * 390,
        y = 270 + Math.cos(t * 0.32 + i) * 230,
        g = c.createRadialGradient(x, y, 0, x, y, 390);
      g.addColorStop(0, [color, "#965cf0", "#ef629f", "#2eabe6", "#ecb36c"][i]);
      g.addColorStop(1, "#07131d00");
      c.fillStyle = g;
      c.fillRect(0, 0, 960, 540);
    }
  } else if (id === "aurora") {
    c.save();
    c.globalCompositeOperation = "screen";
    c.filter = "blur(20px)";
    for (let k = 0; k < 4; k++) {
      c.beginPath();
      for (let x = 0; x <= 960; x += 12) {
        const y =
          230 +
          Math.sin(x * 0.005 + t * 0.35 + k) * 85 +
          Math.cos(x * 0.009 - t * 0.2) * 30 +
          k * 28;
        x ? c.lineTo(x, y) : c.moveTo(x, y);
      }
      c.strokeStyle = [color, "#7183ff99", "#38e7b799", "#c064ed77"][k];
      c.lineWidth = 28;
      c.stroke();
    }
    c.restore();
  } else if (id === "grid") {
    const x = (px / 100) * 960 + Math.sin(t) * 25,
      y = (py / 100) * 540 + Math.cos(t * 0.8) * 25;
    for (let i = 0; i <= 960; i += 30)
      for (let j = 0; j <= 540; j += 30) {
        const glow = Math.exp(-Math.hypot(i - x, j - y) / 140);
        c.globalAlpha = alpha * clamp(0.16 + glow * 0.84);
        dot(c, i, j, 1 + glow * 4, color);
        if (glow > 0.45) {
          c.strokeStyle = color;
          c.lineWidth = glow;
          c.strokeRect(i, j, 30, 30);
        }
      }
    c.globalAlpha = alpha;
  } else if (id === "grain") {
    const tick = Math.floor(t * 24);
    c.globalAlpha = alpha * clamp(0.18 * strength);
    for (let i = 0; i < 2000; i++) {
      const x = noise(i * 3 + tick) * 960,
        y = noise(i * 3 + 1 + tick) * 540;
      c.fillStyle = i % 2 ? "#ffffff" : "#000000";
      c.fillRect(x, y, 1.8, 1.8);
    }
    c.globalAlpha = alpha;
  }
}
