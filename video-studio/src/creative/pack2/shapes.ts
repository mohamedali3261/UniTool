import { dot, line, ease, type C } from "../renderers/common";
export function packShape(c: C, id: string, t: number, color: string) {
  c.translate(480, 270);
  const tau = Math.PI * 2;
  const ellipse = (rx: number, ry: number, a = 0) => {
    c.strokeStyle = color;
    c.lineWidth = 3;
    c.beginPath();
    c.ellipse(0, 0, rx, ry, a, 0, tau);
    c.stroke();
  };
  switch (id) {
    case "orbits":
      for (let i = 0; i < 5; i++) {
        const r = 50 + i * 36,
          a = t * (0.4 + i * 0.13) + i;
        ellipse(r, r * 0.7);
        dot(c, Math.cos(a) * r, Math.sin(a) * r * 0.7, 8 + i, color);
      }
      break;
    case "helix":
      for (let i = 0; i < 36; i++) {
        const y = -200 + i * 11.5,
          x = Math.sin(i * 0.3 - t * 2) * 130;
        line(
          c,
          [
            [-x, y],
            [x, y],
          ],
          "#36566b",
          2,
        );
        dot(c, x, y, 5 + 2 * Math.cos(i * 0.3 - t * 2), color);
        dot(c, -x, y, 5 - 2 * Math.cos(i * 0.3 - t * 2), "#9d89ef");
      }
      break;
    case "atom":
      for (let i = 0; i < 3; i++) {
        const a = (i * Math.PI) / 3;
        ellipse(200, 70, a);
        const q = t * 1.5 + i,
          x = Math.cos(q) * 200,
          y = Math.sin(q) * 70;
        dot(
          c,
          x * Math.cos(a) - y * Math.sin(a),
          x * Math.sin(a) + y * Math.cos(a),
          10,
          color,
        );
      }
      dot(c, 0, 0, 24, "#f7c76c");
      break;
    case "fan":
      for (let i = 0; i < 12; i++) {
        c.save();
        c.translate(0, 170);
        c.rotate(-1.5 + (i / 11) * 3 * ease((Math.sin(t) + 1) / 2));
        c.fillStyle = i % 2 ? color : "#826bdc";
        c.beginPath();
        c.moveTo(0, 0);
        c.lineTo(-20, -350);
        c.lineTo(20, -350);
        c.closePath();
        c.fill();
        c.restore();
      }
      dot(c, 0, 170, 10, "#fff");
      break;
    case "cube": {
      const pts = Array.from({ length: 8 }, (_, i) => {
        const x = (i & 1 ? 1 : -1) * 110,
          y = (i & 2 ? 1 : -1) * 110,
          z = (i & 4 ? 1 : -1) * 110;
        const xx = x * Math.cos(t * 0.5) + z * Math.sin(t * 0.5),
          zz = -x * Math.sin(t * 0.5) + z * Math.cos(t * 0.5);
        return [xx * 0.9 + zz * 0.3, y * 0.9 - zz * 0.4];
      });
      for (let i = 0; i < 8; i++)
        for (const d of [1, 2, 4])
          if ((i ^ d) > i) line(c, [pts[i], pts[i ^ d]], color, 4);
      break;
    }
    case "pinwheel":
      c.rotate(t * 0.7);
      for (let i = 0; i < 8; i++) {
        c.rotate(tau / 8);
        c.fillStyle = i % 2 ? color : "#9d89ef";
        c.beginPath();
        c.moveTo(0, 0);
        c.quadraticCurveTo(250, -90, 180, 80);
        c.quadraticCurveTo(110, 40, 0, 0);
        c.fill();
      }
      dot(c, 0, 0, 15, "#fff");
      break;
    case "infinity": {
      const pts = Array.from({ length: 161 }, (_, i) => {
        const a = (i * tau) / 160;
        return [Math.sin(a) * 240, Math.sin(a * 2) * 100];
      });
      line(c, pts, "#294454", 6);
      for (let i = 0; i < 12; i++) {
        const a = t + i * 0.08;
        dot(c, Math.sin(a) * 240, Math.sin(a * 2) * 100, 3 + i * 0.5, color);
      }
      break;
    }
    case "flower":
      for (let j = 0; j < 9; j++) {
        c.save();
        c.rotate((j * tau) / 9 + t * 0.1);
        c.fillStyle = j % 2 ? color : "#9d89ef";
        c.beginPath();
        c.ellipse(
          0,
          -85,
          35 + Math.sin(t * 1.4) * 12,
          100 + Math.sin(t * 1.4) * 25,
          0,
          0,
          tau,
        );
        c.fill();
        c.restore();
      }
      dot(c, 0, 0, 38, "#f7c76c");
      break;
    case "radar":
      for (let r = 50; r <= 200; r += 50) ellipse(r, r);
      line(
        c,
        [
          [-220, 0],
          [220, 0],
        ],
        "#335263",
        2,
      );
      line(
        c,
        [
          [0, -220],
          [0, 220],
        ],
        "#335263",
        2,
      );
      c.rotate(t);
      for (let j = 0; j < 20; j++) {
        c.save();
        c.globalAlpha *= (1 - j / 20) * 0.4;
        c.rotate(-j * 0.025);
        line(
          c,
          [
            [0, 0],
            [200, 0],
          ],
          color,
          5,
        );
        c.restore();
      }
      dot(c, 130, 0, 7, "#fff");
      break;
    case "metronome":
      line(
        c,
        [
          [-140, 180],
          [0, -190],
          [140, 180],
          [-140, 180],
        ],
        color,
        7,
      );
      {
        const a = Math.sin(t * 3) * 0.55,
          x = Math.sin(a) * 250,
          y = 150 - Math.cos(a) * 250;
        line(
          c,
          [
            [0, 150],
            [x, y],
          ],
          "#fff",
          7,
        );
        dot(c, x, y, 22, color);
      }
      break;
  }
}
