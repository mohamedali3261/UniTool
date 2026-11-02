import {
  card,
  label,
  dot,
  line,
  ease,
  clamp,
  type C,
} from "../renderers/common";
/** Scripted UI illustrations, deliberately not advertised as interactive widgets. */
export function packUI(
  c: C,
  id: string,
  t: number,
  color: string,
  text: string,
) {
  const alpha = c.globalAlpha,
    p = ease((t % 5) / 3.5);
  card(c, 180, 65, 600, 410, "#132737", 26);
  label(c, text, 480, 105, 26, color);
  switch (id) {
    case "chat":
      for (let i = 0; i < 4; i++) {
        const z = ease(t - i * 0.4);
        c.save();
        c.globalAlpha = alpha * z;
        const x = i % 2 ? 380 : 220,
          y = 155 + i * 70 + (1 - z) * 30;
        card(c, x, y, 320, 52, i % 2 ? color : "#2a4557", 18);
        label(
          c,
          [
            "أهلًا! جاهز نبدأ؟",
            "أكيد، عندي فكرة جديدة",
            "خلّينا نحولها لفيديو",
            "تم، النتيجة رائعة",
          ][i],
          x + 160,
          y + 26,
          21,
          i % 2 ? "#09222c" : "#fff",
        );
        c.restore();
      }
      break;
    case "audio":
      card(c, 220, 150, 130, 130, color, 18);
      label(c, "♫", 285, 215, 70, "#10252f");
      label(c, "Creative Sessions", 540, 190, 30);
      label(c, "01:24 / 03:00", 540, 235, 20, "#a8bfca");
      for (let i = 0; i < 35; i++) {
        const h = 10 + Math.sin(t * 4 + i * 0.7) ** 2 * 65;
        line(
          c,
          [
            [235 + i * 14, 340 - h / 2],
            [235 + i * 14, 340 + h / 2],
          ],
          i / 35 < p ? color : "#355060",
          5,
        );
      }
      dot(c, 480, 420, 26, color);
      line(
        c,
        [
          [474, 410],
          [474, 430],
          [490, 420],
          [474, 410],
        ],
        "#10252f",
        3,
      );
      break;
    case "calendar":
      label(c, "NOVEMBER", 480, 155, 24);
      for (let i = 0; i < 28; i++) {
        const x = 270 + (i % 7) * 70,
          y = 220 + Math.floor(i / 7) * 55;
        const selected = Math.floor(t * 2) % 28 === i;
        if (selected) card(c, x - 22, y - 22, 44, 44, color, 12);
        label(c, String(i + 1), x, y, 21, selected ? "#10252f" : "#d3e4ed");
      }
      break;
    case "ticket":
      line(
        c,
        [
          [230, 255],
          [730, 255],
        ],
        "#496573",
        2,
      );
      label(c, "CAI", 300, 205, 55);
      label(c, "DXB", 660, 205, 55);
      const x = 370 + ((t * 0.2) % 1) * 210;
      line(
        c,
        [
          [380, 205],
          [580, 205],
        ],
        color,
        2,
      );
      label(c, "✈", x, 205, 34, color);
      label(c, "BOARDING  09:45", 480, 300, 25);
      for (let i = 0; i < 50; i++) {
        c.fillStyle = i % 3 ? color : "#fff";
        c.fillRect(245 + i * 9, 350, 2 + (i % 3), 65);
      }
      break;
    case "pricing":
      label(c, "PRO", 480, 180, 35, color);
      label(c, "$29", 480, 245, 78);
      for (let i = 0; i < 3; i++) {
        const z = ease(t - i * 0.4);
        c.save();
        c.globalAlpha = alpha * z;
        label(c, "✓", 310, 310 + i * 38, 25, color);
        label(
          c,
          ["Unlimited projects", "HD export", "Creative elements"][i],
          500,
          310 + i * 38,
          22,
        );
        c.restore();
      }
      break;
    case "upload": {
      const q = (t % 6) / 6;
      line(
        c,
        [
          [480, 235],
          [480, 170],
          [455, 195],
          [480, 170],
          [505, 195],
        ],
        color,
        7,
      );
      card(c, 240, 300, 480, 28, "#294554", 14);
      if (q > 0) card(c, 240, 300, 480 * q, 28, color, Math.min(14, 240 * q));
      label(c, `${Math.floor(q * 100)}%`, 480, 365, 50);
      label(c, "project-video.mp4", 480, 420, 23);
      break;
    }
    case "terminal":
      for (let i = 0; i < 3; i++)
        dot(c, 225 + i * 28, 145, 7, ["#ff7d89", "#ffd277", color][i]);
      for (let i = 0; i < 5; i++) {
        const z = ease(t - i * 0.45);
        c.save();
        c.globalAlpha = alpha * z;
        label(
          c,
          [
            "$ build creative-project",
            "✓ assets loaded",
            "✓ motion compiled",
            "✓ frames rendered",
            "✓ build complete",
          ][i],
          480,
          195 + i * 47,
          24,
          i === 4 ? color : "#d7e8f0",
        );
        c.restore();
      }
      break;
    case "tabs":
      for (let i = 0; i < 3; i++) {
        const active = Math.floor(t / 1.2) % 3 === i;
        card(c, 215 + i * 180, 150, 165, 48, active ? color : "#294353", 12);
        label(
          c,
          ["Design", "Preview", "Export"][i],
          297 + i * 180,
          174,
          23,
          active ? "#10252f" : "#fff",
        );
      }
      card(c, 220, 220, 520, 210, "#0b1c28", 14);
      const tab = Math.floor(t / 1.2) % 3;
      for (let i = 0; i < 3 + tab; i++)
        card(
          c,
          250 + i * 85,
          270,
          60,
          80 + Math.sin(t + i) * 30,
          i % 2 ? color : "#8069d4",
          12,
        );
      break;
    case "route":
      for (let i = 0; i < 8; i++)
        line(
          c,
          [
            [230 + i * 70, 170],
            [230 + i * 70, 435],
          ],
          "#254252",
          2,
        );
      for (let i = 0; i < 6; i++)
        line(
          c,
          [
            [230, 170 + i * 50],
            [730, 170 + i * 50],
          ],
          "#254252",
          2,
        );
      {
        const pts = [
            [255, 400],
            [350, 400],
            [350, 300],
            [550, 300],
            [550, 200],
            [700, 200],
          ],
          u = ((t * 0.22) % 1) * 5,
          k = Math.min(4, Math.floor(u)),
          f = u - k;
        line(c, pts, color, 7);
        dot(
          c,
          pts[k][0] + (pts[k + 1][0] - pts[k][0]) * f,
          pts[k][1] + (pts[k + 1][1] - pts[k][1]) * f,
          13,
          "#fff",
        );
      }
      break;
    case "weather":
      dot(c, 400, 245, 57, "#ffd277");
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI) / 4 + t * 0.2;
        line(
          c,
          [
            [400 + Math.cos(a) * 72, 245 + Math.sin(a) * 72],
            [400 + Math.cos(a) * 91, 245 + Math.sin(a) * 91],
          ],
          "#ffd277",
          5,
        );
      }
      label(c, "24°", 600, 240, 76);
      card(c, 270 + Math.sin(t) * 12, 300, 290, 65, "#a7c4d9", 32);
      dot(c, 350 + Math.sin(t) * 12, 300, 47, "#a7c4d9");
      label(c, "Cairo · 18° / 26°", 480, 415, 24);
      break;
  }
  c.globalAlpha = alpha;
}
