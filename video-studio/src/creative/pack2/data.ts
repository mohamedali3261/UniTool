import type { CreativeSettings } from "../catalog";
import {
  card,
  dot,
  label,
  line,
  ease,
  noise,
  type C,
} from "../renderers/common";
export function packData(
  c: C,
  id: string,
  t: number,
  color: string,
  text: string,
  s: CreativeSettings,
) {
  const values = s.data ?? [22, 68, 43, 90, 55, 76, 38, 61],
    p = ease(t / 3),
    alpha = c.globalAlpha;
  const peak = Math.max(1, ...values.map(Math.abs)),
    v = values.map((x) => Math.abs(x) / peak),
    n = Math.min(v.length, 20);
  label(c, text, 480, 65, 30, color);
  switch (id) {
    case "bars":
      for (let i = 0; i < Math.min(n, 8); i++) {
        const y = 130 + i * 43;
        label(c, String(i + 1), 145, y + 14, 20);
        card(
          c,
          180,
          y,
          Math.max(1, 580 * v[i] * p),
          28,
          color,
          Math.min(8, 290 * v[i] * p),
        );
        label(c, String(Math.round(values[i] * p)), 810, y + 14, 22);
      }
      break;
    case "area": {
      const pts = v.map((q, i) => [
        130 + (i / (v.length - 1)) * 700,
        420 - q * 270 * p,
      ]);
      c.beginPath();
      c.moveTo(130, 420);
      pts.forEach((q) => c.lineTo(q[0], q[1]));
      c.lineTo(830, 420);
      c.closePath();
      c.save();
      c.globalAlpha = alpha * 0.25;
      c.fillStyle = color;
      c.fill();
      c.restore();
      line(c, pts, color, 5);
      break;
    }
    case "scatter":
      for (let i = 0; i < 50; i++) {
        const x = 140 + noise(i) * 680,
          y = 420 - v[i % v.length] * 270 * (0.6 + 0.4 * noise(i + 50));
        dot(
          c,
          480 + (x - 480) * p,
          280 + (y - 280) * p,
          5 + noise(i + 80) * 7,
          i % 3 ? color : "#9d89ef",
        );
      }
      break;
    case "gauge": {
      c.strokeStyle = "#2c4656";
      c.lineWidth = 32;
      c.beginPath();
      c.arc(480, 330, 170, Math.PI, Math.PI * 2);
      c.stroke();
      const a = Math.PI + Math.PI * ((s.value ?? 72) / 100) * p;
      line(
        c,
        [
          [480, 330],
          [480 + Math.cos(a) * 145, 330 + Math.sin(a) * 145],
        ],
        color,
        7,
      );
      dot(c, 480, 330, 16, "#fff");
      label(c, `${Math.round((s.value ?? 72) * p)}%`, 480, 410, 50, color);
      break;
    }
    case "funnel":
      for (let i = 0; i < 5; i++) {
        const w = (680 - i * 105) * (0.35 + 0.65 * p),
          y = 125 + i * 65;
        c.fillStyle = [color, "#7bb6e8", "#9d89ef", "#c596db", "#f1b97e"][i];
        c.beginPath();
        c.moveTo(480 - w / 2, y);
        c.lineTo(480 + w / 2, y);
        c.lineTo(480 + (w - 65) / 2, y + 53);
        c.lineTo(480 - (w - 65) / 2, y + 53);
        c.closePath();
        c.fill();
        label(
          c,
          `${Math.round(v[i % v.length] * 100 * p)}%`,
          480,
          y + 26,
          23,
          "#10212d",
        );
      }
      break;
    case "stacks":
      for (let i = 0; i < Math.min(n, 10); i++) {
        const x = 150 + i * 65;
        let y = 430;
        for (let j = 0; j < 3; j++) {
          const h = 30 + v[(i + j) % v.length] * 80 * p;
          y -= h;
          card(c, x, y, 42, h - 4, [color, "#9d89ef", "#f1b97e"][j], 4);
        }
      }
      break;
    case "bubbles":
      for (let i = 0; i < Math.min(n, 12); i++) {
        const a = (i * Math.PI * 2) / Math.min(n, 12) + t * 0.1,
          r = 90 + 35 * (i % 3);
        c.save();
        c.globalAlpha = alpha * 0.7;
        dot(
          c,
          480 + Math.cos(a) * r,
          285 + Math.sin(a) * r * 0.7,
          (12 + v[i] * 40) * p,
          color,
        );
        c.restore();
        label(
          c,
          String(values[i]),
          480 + Math.cos(a) * r,
          285 + Math.sin(a) * r * 0.7,
          18,
        );
      }
      break;
    case "candles":
      for (let i = 0; i < Math.min(n, 16); i++) {
        const x = 160 + (i * 640) / Math.min(n, 16),
          a = 420 - v[i] * 250 * p,
          b = 420 - v[(i + 1) % v.length] * 250 * p,
          ink = a > b ? color : "#ff8b97";
        line(
          c,
          [
            [x, Math.min(a, b) - 25],
            [x, Math.max(a, b) + 25],
          ],
          ink,
          2,
        );
        card(
          c,
          x - 12,
          Math.min(a, b),
          24,
          Math.max(4, Math.abs(a - b)),
          ink,
          3,
        );
      }
      break;
    case "treemap": {
      const sum = values.reduce((a, b) => a + Math.abs(b), 0) || 1;
      let x = 130;
      for (let i = 0; i < values.length; i++) {
        const w = (Math.abs(values[i]) / sum) * 700;
        c.save();
        c.globalAlpha = alpha * ease(t - i * 0.12);
        card(
          c,
          x + 2,
          140,
          w > 4 ? w - 4 : 1,
          290,
          [color, "#9d89ef", "#71aede"][i % 3],
          Math.min(8, w / 3),
        );
        if (w > 40) label(c, String(values[i]), x + w / 2, 285, 22, "#10212d");
        c.restore();
        x += w;
      }
      break;
    }
    case "network": {
      const count = Math.min(n, 12),
        pts = Array.from({ length: count }, (_, i) => {
          const a = (i * Math.PI * 2) / count;
          return [480 + Math.cos(a) * 240, 285 + Math.sin(a) * 165];
        });
      for (let i = 0; i < count; i++) {
        line(c, [pts[i], pts[(i + 1) % count]], "#3b596c", 3);
        line(c, [pts[i], pts[(i + 3) % count]], "#3b596c", 1);
        const q = (t * 0.3 + i * 0.2) % 1,
          j = (i + 1) % count;
        dot(
          c,
          pts[i][0] + (pts[j][0] - pts[i][0]) * q,
          pts[i][1] + (pts[j][1] - pts[i][1]) * q,
          4,
          color,
        );
        dot(
          c,
          ...(pts[i] as [number, number]),
          (10 + v[i] * 15) * (0.7 + 0.3 * p),
          color,
        );
      }
      break;
    }
  }
  c.globalAlpha = alpha;
}
