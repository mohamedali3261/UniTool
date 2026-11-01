import { ease, spring, type C } from "../renderers/common";
/** Whole strings preserve Arabic shaping; transforms and masks never split letters. */
export function packText(
  c: C,
  id: string,
  text: string,
  size: number,
  width: number,
  time: number,
  color: string,
) {
  const p = ease(time / 2.4),
    alpha = c.globalAlpha;
  text.split("\n").forEach((s, row) => {
    c.save();
    c.translate(0, row * size * 1.2);
    const w = c.measureText(s).width || 1;
    c.scale(Math.min(1, width / w), 1);
    const draw = () => {
      c.fillStyle = color;
      c.fillText(s, 0, 0);
    };
    switch (id) {
      case "rise":
        c.globalAlpha = alpha * p;
        c.translate(0, (1 - p) * size * 1.5);
        draw();
        break;
      case "elastic": {
        const z = 0.2 + 0.8 * spring(time / 2);
        c.scale(z, z);
        draw();
        break;
      }
      case "outline":
        c.strokeStyle = color;
        c.lineWidth = Math.max(1, size / 35);
        c.strokeText(s, 0, 0);
        c.save();
        c.beginPath();
        c.rect(-w / 2, -size, w * p, size * 2);
        c.clip();
        draw();
        c.restore();
        break;
      case "chroma":
        for (const [i, ink] of ["#ff6f91", "#5abfff", color].entries()) {
          c.fillStyle = ink;
          c.fillText(
            s,
            (i - 1) * (1 - p) * size * 0.35,
            (1 - i) * Math.sin(time * 4) * (1 - p) * size * 0.12,
          );
        }
        break;
      case "spotlight": {
        c.globalAlpha = alpha * 0.22;
        draw();
        c.globalAlpha = alpha;
        c.beginPath();
        c.ellipse(
          -w / 2 + w * ((time * 0.3) % 1),
          0,
          size * 1.5,
          size,
          0,
          0,
          Math.PI * 2,
        );
        c.clip();
        draw();
        break;
      }
      case "curtain":
        c.beginPath();
        c.rect((-w * p) / 2, -size, w * p, size * 2);
        c.clip();
        draw();
        break;
      case "echo":
        for (let i = 4; i >= 0; i--) {
          c.globalAlpha = alpha * (i ? 0.12 * (1 - p) : 1);
          c.fillStyle = color;
          c.fillText(s, i * size * 0.12 * (1 - p), i * size * 0.22 * (1 - p));
        }
        break;
      case "ribbon": {
        c.fillStyle = color;
        c.fillRect(
          -w / 2 - size * 0.15,
          -size * 0.6,
          (w + size * 0.3) * p,
          size * 1.2,
        );
        c.beginPath();
        c.rect(-w / 2 - size * 0.15, -size, (w + size * 0.3) * p, size * 2);
        c.clip();
        c.fillStyle = "#081b25";
        c.fillText(s, 0, 0);
        break;
      }
      case "glow":
        c.shadowColor = color;
        c.shadowBlur = size * (0.1 + 0.4 * (0.5 + 0.5 * Math.sin(time * 3)));
        c.globalAlpha = alpha * (0.65 + 0.35 * Math.sin(time * 3) ** 2);
        draw();
        break;
      case "tilt":
        c.rotate((1 - p) * -0.3);
        c.translate((1 - p) * -size * 2, 0);
        c.globalAlpha = alpha * p;
        draw();
        break;
    }
    c.restore();
  });
}
