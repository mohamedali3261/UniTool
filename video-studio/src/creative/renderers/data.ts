import type { CreativeSettings } from "../catalog";
import { card, dot, label, line, ease, clamp, type C } from "./common";
export function drawData(
  c: C,
  id: string,
  t: number,
  color: string,
  text: string,
  settings: CreativeSettings,
) {
  const alpha = c.globalAlpha;
  const p = ease(t / 3);
  let samples = Array.from({ length: 60 }, (_, i) => [
    120 + i * 12,
    350 - Math.sin(i * 0.1) * 55 - i * 2 + Math.sin(i * 0.53) * 14,
  ]);
  if (settings.data?.length) {
    const min = Math.min(...settings.data),
      max = Math.max(...settings.data);
    samples = settings.data.map((v, i) => [
      120 + (i / (settings.data!.length - 1)) * 708,
      400 - ((v - min) / Math.max(Number.EPSILON, max - min)) * 250,
    ]);
  }
  if (id === "line") {
    line(
      c,
      [
        [100, 100],
        [100, 420],
        [860, 420],
      ],
      "#436071",
      2,
    );
    const count = Math.max(1, Math.floor(p * samples.length));
    line(c, samples.slice(0, count), color, 5);
    const last = samples[count - 1];
    c.shadowColor = color;
    c.shadowBlur = 20;
    dot(c, last[0], last[1], 7, color);
    c.shadowBlur = 0;
    label(c, text, 480, 80, 32);
  } else if (id === "donut") {
    c.strokeStyle = "#29414e";
    c.lineWidth = 24;
    c.beginPath();
    c.arc(480, 270, 145, 0, Math.PI * 2);
    c.stroke();
    c.strokeStyle = color;
    c.lineCap = "round";
    c.beginPath();
    c.arc(
      480,
      270,
      145,
      -Math.PI / 2,
      -Math.PI / 2 + Math.PI * 2 * p * ((settings.value ?? 86) / 100),
    );
    c.stroke();
    label(c, `${Math.round(p * (settings.value ?? 86))}%`, 480, 270, 62);
    label(c, text, 480, 475, 25);
  } else if (id === "sparkline") {
    for (let k = 0; k < 3; k++) {
      card(c, 80 + k * 280, 140, 255, 270);
      label(
        c,
        `${Math.round((k + 1) * 1240 * p)}`,
        207 + k * 280,
        205,
        32,
        color,
      );
      const pts = samples
        .slice(0, Math.max(1, Math.floor(p * samples.length)))
        .map(([x, y]) => [
          105 + k * 280 + (x - 120) * 0.29,
          330 + (y - 300) * 0.4 + Math.sin(k) * 10,
        ]);
      line(c, pts, color, 3);
      label(c, ["Views", "Revenue", "Growth"][k], 207 + k * 280, 370, 20);
    }
  } else if (id === "heatmap") {
    for (let x = 0; x < 14; x++)
      for (let y = 0; y < 7; y++) {
        c.globalAlpha =
          alpha *
          clamp(
            0.1 +
              clamp((t - (x + y) * 0.08) / 0.8) *
                (settings.data
                  ? Math.max(
                      0.1,
                      Math.abs(
                        settings.data[(x * 7 + y) % settings.data.length],
                      ) / Math.max(1, ...settings.data.map(Math.abs)),
                    )
                  : 0.2 + Math.sin(x * 3 + y * 2) ** 2 * 0.8),
          );
        card(c, 140 + x * 49, 110 + y * 47, 40, 38, color, 6);
      }
    c.globalAlpha = alpha;
    label(c, text, 480, 480, 25);
  } else if (id === "flow") {
    card(c, 80, 190, 220, 160);
    card(c, 660, 190, 220, 160);
    label(c, "SOURCE", 190, 270, 24);
    label(c, "TARGET", 770, 270, 24);
    for (let k = 0; k < 3; k++) {
      const y = 230 + k * 40;
      line(
        c,
        Array.from({ length: 61 }, (_, i) => [
          300 + (360 * i) / 60,
          y + (540 - 2 * y) * ease(i / 60),
        ]),
        "#355666",
        2,
      );
      for (let j = 0; j < 4; j++) {
        const u = (t * 0.25 + j / 4 + k * 0.1) % 1,
          x = 300 + 360 * u,
          v = ease(u);
        dot(c, x, y + (540 - 2 * y) * v, 5, color);
      }
    }
    label(c, text, 480, 120, 28);
  }
}
