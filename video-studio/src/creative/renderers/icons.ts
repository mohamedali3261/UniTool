import {
  card,
  dot,
  label,
  line,
  ease,
  clamp,
  noise,
  spring,
  type C,
} from "./common";
export function drawIcon(
  c: C,
  id: string,
  t: number,
  color: string,
  text: string,
) {
  const alpha = c.globalAlpha;
  c.strokeStyle = color;
  c.fillStyle = color;
  c.lineWidth = 12;
  c.lineCap = "round";
  c.lineJoin = "round";
  if (id === "stroke") {
    c.save();
    c.setLineDash([900]);
    c.lineDashOffset = 900 * (1 - ease(t / 2));
    c.beginPath();
    c.moveTo(330, 240);
    c.lineTo(440, 350);
    c.lineTo(650, 150);
    c.stroke();
    c.beginPath();
    c.arc(
      480,
      260,
      170,
      -Math.PI / 2,
      -Math.PI / 2 + Math.PI * 2 * ease(t / 2),
    );
    c.stroke();
    c.restore();
  } else if (id === "morph") {
    const p = 0.5 - 0.5 * Math.cos(t * 1.5);
    const a = () =>
        line(
          c,
          [
            [350, 220 - 60 * p],
            [610, 220 + 100 * p],
          ],
          color,
          12,
        ),
      b = () =>
        line(
          c,
          [
            [350, 320],
            [610, 320 - 160 * p],
          ],
          color,
          12,
        );
    a();
    b();
    c.globalAlpha = alpha * clamp(1 - p);
    line(
      c,
      [
        [350, 270],
        [610, 270],
      ],
      color,
      12,
    );
    c.globalAlpha = alpha;
  } else if (id === "bounce") {
    const q = t % 2.5,
      b = spring(q),
      sy = 1 + Math.sin(q * 7) * Math.exp(-q * 2) * 0.25;
    c.save();
    c.translate(480, 260 + (1 - b) * -160);
    c.scale(1 / sy, sy);
    card(c, -90, -90, 180, 180, color, 35);
    label(c, "✓", 0, 0, 100, "#102633");
    c.restore();
  } else if (id === "spinners") {
    for (let k = 0; k < 3; k++) {
      const x = 220 + k * 260;
      if (k === 0)
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2;
          c.globalAlpha = alpha * clamp(0.2 + 0.8 * ((i / 8 + t) % 1));
          dot(c, x + Math.cos(a) * 65, 260 + Math.sin(a) * 65, 9, color);
        }
      else if (k === 1) {
        c.globalAlpha = alpha;
        c.beginPath();
        c.arc(x, 260, 70, t * 4, t * 4 + Math.PI * 1.5);
        c.stroke();
      } else {
        c.globalAlpha =
          alpha * clamp(0.2 + 0.8 * (0.5 + 0.5 * Math.sin(t * 3)));
        dot(c, x, 260, 25 + 20 * Math.sin(t * 3) ** 2, color);
      }
    }
    c.globalAlpha = alpha;
  } else if (id === "confetti") {
    const age = t % 4;
    for (let i = 0; i < 120; i++) {
      const a = noise(i) * Math.PI * 2,
        s = 80 + noise(i + 100) * 240,
        x = 480 + Math.cos(a) * s * age,
        y = 260 + Math.sin(a) * s * age + 110 * age * age;
      c.save();
      c.globalAlpha = alpha * clamp(clamp(1 - age / 3.7));
      c.translate(x, y);
      c.rotate(age * (noise(i + 44) * 10 - 5));
      c.fillStyle = [color, "#f4c96b", "#ec719f", "#9a80ec"][i % 4];
      c.fillRect(-4, -4, 6 + noise(i) * 7, 12);
      c.restore();
    }
    label(c, text, 480, 270, 40);
  }
}
