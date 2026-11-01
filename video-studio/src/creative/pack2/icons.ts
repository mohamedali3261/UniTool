import { card, dot, line, ease, type C } from "../renderers/common";
export function packIcon(c: C, id: string, t: number, color: string) {
  c.translate(480, 270);
  c.lineWidth = 9;
  c.strokeStyle = color;
  c.lineCap = "round";
  c.lineJoin = "round";
  switch (id) {
    case "heart": {
      const z = 1 + 0.12 * Math.sin(t * 6) ** 8;
      c.scale(z, z);
      c.fillStyle = color;
      c.beginPath();
      c.moveTo(0, 125);
      c.bezierCurveTo(-250, -30, -90, -190, 0, -70);
      c.bezierCurveTo(90, -190, 250, -30, 0, 125);
      c.fill();
      break;
    }
    case "bell":
      c.rotate(Math.sin(t * 9) * Math.exp(-((t % 3) * 1.7)) * 0.4);
      c.beginPath();
      c.moveTo(-110, 75);
      c.quadraticCurveTo(-80, 40, -80, -45);
      c.bezierCurveTo(-80, -155, 80, -155, 80, -45);
      c.quadraticCurveTo(80, 40, 110, 75);
      c.closePath();
      c.stroke();
      dot(c, 0, 110, 17, color);
      dot(c, 0, -150, 12, color);
      break;
    case "cloud":
      c.beginPath();
      c.moveTo(-100, 30);
      c.bezierCurveTo(-210, 20, -170, -100, -80, -75);
      c.bezierCurveTo(-60, -180, 100, -170, 100, -65);
      c.bezierCurveTo(200, -80, 220, 40, 120, 40);
      c.stroke();
      {
        const y = 15 + ((t * 0.7) % 1) * 90;
        line(
          c,
          [
            [0, y - 55],
            [0, y + 35],
            [-30, y + 5],
            [0, y + 35],
            [30, y + 5],
          ],
          color,
          9,
        );
      }
      break;
    case "location":
      c.translate(0, -Math.abs(Math.sin(t * 2)) * 35);
      c.beginPath();
      c.moveTo(0, 140);
      c.bezierCurveTo(-230, -50, -75, -230, 55, -130);
      c.bezierCurveTo(170, -40, 70, 75, 0, 140);
      c.stroke();
      c.beginPath();
      c.arc(0, -45, 35, 0, Math.PI * 2);
      c.stroke();
      break;
    case "lock":
      card(c, -105, -15, 210, 170, color, 25);
      c.save();
      c.translate(-65, -15);
      c.rotate(-ease((Math.sin(t) + 1) / 2) * 0.7);
      c.beginPath();
      c.moveTo(0, 0);
      c.lineTo(0, -65);
      c.bezierCurveTo(0, -150, 130, -150, 130, -65);
      c.lineTo(130, 0);
      c.stroke();
      c.restore();
      dot(c, 0, 65, 17, "#102631");
      line(
        c,
        [
          [0, 65],
          [0, 105],
        ],
        "#102631",
        10,
      );
      break;
    case "battery":
      c.strokeRect(-165, -85, 300, 170);
      card(c, 143, -30, 23, 60, color, 8);
      for (let i = 0; i < 5; i++) {
        c.save();
        c.globalAlpha *= ease(((t % 4) / 4) * 6 - i);
        card(c, -145 + i * 55, -65, 42, 130, color, 5);
        c.restore();
      }
      break;
    case "wifi":
      dot(c, 0, 100, 15, color);
      for (let i = 1; i <= 3; i++) {
        c.save();
        c.globalAlpha *= 0.2 + 0.8 * (0.5 + 0.5 * Math.sin(t * 3 - i));
        c.beginPath();
        c.arc(0, 100, 60 * i, Math.PI * 1.2, Math.PI * 1.8);
        c.stroke();
        c.restore();
      }
      break;
    case "rocket":
      c.translate(Math.sin(t * 2) * 5, -Math.sin(t) * 20);
      c.fillStyle = color;
      c.beginPath();
      c.moveTo(0, -170);
      c.bezierCurveTo(90, -80, 65, 70, 45, 90);
      c.lineTo(-45, 90);
      c.bezierCurveTo(-65, 70, -90, -80, 0, -170);
      c.fill();
      dot(c, 0, -30, 30, "#112a39");
      line(
        c,
        [
          [-45, 40],
          [-100, 100],
          [-45, 80],
        ],
        color,
        9,
      );
      line(
        c,
        [
          [45, 40],
          [100, 100],
          [45, 80],
        ],
        color,
        9,
      );
      c.fillStyle = "#ffc26e";
      c.beginPath();
      c.moveTo(-27, 105);
      c.lineTo(0, 140 + Math.sin(t * 17) ** 2 * 60);
      c.lineTo(27, 105);
      c.fill();
      break;
    case "book": {
      const w = 50 + 120 * (0.5 + 0.5 * Math.sin(t));
      line(
        c,
        [
          [0, -130],
          [0, 140],
        ],
        color,
        7,
      );
      for (const s of [-1, 1]) {
        c.beginPath();
        c.moveTo(0, -110);
        c.quadraticCurveTo((s * w) / 2, -150, s * w, -110);
        c.lineTo(s * w, 120);
        c.quadraticCurveTo((s * w) / 2, 80, 0, 140);
        c.closePath();
        c.stroke();
        for (let i = 0; i < 4; i++)
          line(
            c,
            [
              [s * 20, -55 + i * 40],
              [s * (w - 20), -65 + i * 40],
            ],
            color,
            3,
          );
      }
      break;
    }
    case "hourglass": {
      const q = (t % 5) / 5;
      c.rotate(q > 0.85 ? ease((q - 0.85) / 0.15) * Math.PI : 0);
      line(
        c,
        [
          [-100, -160],
          [100, -160],
        ],
        color,
        10,
      );
      line(
        c,
        [
          [-100, 160],
          [100, 160],
        ],
        color,
        10,
      );
      line(
        c,
        [
          [-80, -150],
          [-80, -90],
          [75, 100],
          [75, 150],
        ],
        color,
        7,
      );
      line(
        c,
        [
          [80, -150],
          [80, -90],
          [-75, 100],
          [-75, 150],
        ],
        color,
        7,
      );
      c.fillStyle = "#f6c577";
      c.beginPath();
      c.moveTo(-60, -105);
      c.lineTo(60, -105);
      c.lineTo(0, -5 - q * 0.8 * 80);
      c.closePath();
      c.fill();
      c.beginPath();
      c.moveTo(-65, 140);
      c.lineTo(65, 140);
      c.lineTo(0, 140 - q * 120);
      c.closePath();
      c.fill();
      for (let i = 0; i < 8; i++)
        dot(c, 0, (i * 20 + t * 80) % 120, 2, "#f6c577");
      break;
    }
  }
}
