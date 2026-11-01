import { dot, line, noise, type C } from "../renderers/common";
export function packBackground(c: C, id: string, t: number, color: string) {
  const alpha = c.globalAlpha;
  c.fillStyle = "#081621";
  c.fillRect(0, 0, 960, 540);
  switch (id) {
    case "stars":
      for (let i = 0; i < 130; i++) {
        const a = noise(i) * Math.PI * 2,
          r = ((noise(i + 200) + t * 0.18) % 1) ** 2 * 650;
        dot(
          c,
          480 + Math.cos(a) * r,
          270 + Math.sin(a) * r * 0.7,
          1 + r / 150,
          color,
        );
      }
      break;
    case "terrain":
      for (let y = 0; y < 22; y++) {
        const pts = Array.from({ length: 61 }, (_, i) => [
          i * 16,
          100 +
            y * 20 +
            Math.sin(i * 0.17 + t + y * 0.25) * 18 +
            Math.cos(i * 0.3 - t * 0.7) * 10,
        ]);
        c.globalAlpha = alpha * (0.2 + y / 30);
        line(c, pts, color, 1.5);
      }
      break;
    case "rings":
      for (let i = 0; i < 14; i++) {
        const r = (i * 48 + t * 45) % 680;
        c.globalAlpha = alpha * (1 - r / 680);
        c.strokeStyle = color;
        c.lineWidth = 3;
        c.beginPath();
        c.ellipse(
          480,
          270,
          r,
          Math.max(0.1, r * 0.6),
          Math.sin(t * 0.3) * 0.2,
          0,
          Math.PI * 2,
        );
        c.stroke();
      }
      break;
    case "hex":
      for (let y = -1; y < 9; y++)
        for (let x = -1; x < 15; x++) {
          const cx = x * 72 + (y % 2) * 36,
            cy = y * 62;
          const pts = Array.from({ length: 7 }, (_, i) => [
            cx + 33 * Math.cos((i * Math.PI) / 3),
            cy + 33 * Math.sin((i * Math.PI) / 3),
          ]);
          c.globalAlpha =
            alpha *
            (0.1 + 0.8 * (0.5 + 0.5 * Math.sin(x * 0.5 + y * 0.6 - t * 1.7)));
          line(c, pts, color, 2);
        }
      break;
    case "rain":
      for (let i = 0; i < 90; i++) {
        const x = noise(i) * 1100,
          y =
            ((noise(i + 100) * 700 + t * (50 + noise(i + 300) * 120)) % 700) -
            90;
        c.globalAlpha = alpha * (0.2 + noise(i + 40) * 0.8);
        line(
          c,
          [
            [x, y],
            [x - 30, y + 80],
          ],
          color,
          1 + noise(i + 10) * 3,
        );
      }
      break;
    case "checker":
      for (let y = 0; y < 12; y++)
        for (let x = 0; x < 20; x++) {
          const z =
            0.15 + 0.85 * (0.5 + 0.5 * Math.sin(x * 0.4 + y * 0.35 - t));
          c.globalAlpha = alpha * z;
          const s = 42 * z;
          c.fillStyle = (x + y) % 2 ? color : "#9d89ef";
          c.fillRect(x * 50 + (50 - s) / 2, y * 50 + (50 - s) / 2, s, s);
        }
      break;
    case "facets":
      for (let y = 0; y < 6; y++)
        for (let x = 0; x < 10; x++) {
          const k = x + y * 10,
            dx = Math.sin(t * 0.5 + k) * 24,
            dy = Math.cos(t * 0.6 + k) * 20;
          c.globalAlpha = alpha * (0.15 + 0.5 * noise(k));
          c.fillStyle = k % 3 ? color : "#9d89ef";
          c.beginPath();
          c.moveTo(x * 110 - 20, y * 110);
          c.lineTo(x * 110 + 100, y * 110);
          c.lineTo(x * 110 + 50 + dx, y * 110 + 120 + dy);
          c.closePath();
          c.fill();
        }
      break;
    case "bokeh":
      for (let i = 0; i < 32; i++) {
        const x =
            ((noise(i) * 1100 + Math.sin(t * 0.2 + i) * 80 + 1100) % 1100) - 70,
          y =
            ((noise(i + 80) * 700 - t * (8 + noise(i + 40) * 12) + 700) % 700) -
            80;
        const r = 20 + noise(i + 9) * 70,
          g = c.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, color + "aa");
        g.addColorStop(1, color + "00");
        c.fillStyle = g;
        c.fillRect(x - r, y - r, r * 2, r * 2);
      }
      break;
    case "scope":
      for (let j = 0; j < 6; j++) {
        c.globalAlpha = alpha * (0.2 + j * 0.12);
        line(
          c,
          Array.from({ length: 181 }, (_, i) => [
            (i * 960) / 180,
            270 +
              Math.sin(i * 0.15 + t * 2 + j * 0.6) *
                Math.sin(i * 0.035 - t * 0.3) *
                180,
          ]),
          color,
          2,
        );
      }
      break;
    case "kaleido":
      c.translate(480, 270);
      for (let k = 0; k < 16; k++) {
        c.save();
        c.rotate((k * Math.PI) / 8 + t * 0.12);
        c.globalAlpha = alpha * 0.5;
        c.fillStyle = k % 2 ? color : "#9d89ef";
        c.beginPath();
        c.moveTo(30, 0);
        c.lineTo(200 + Math.sin(t + k) * 60, 60);
        c.lineTo(380, 0);
        c.lineTo(200 + Math.cos(t + k) * 60, -60);
        c.closePath();
        c.fill();
        c.restore();
      }
      break;
  }
  c.globalAlpha = alpha;
}
