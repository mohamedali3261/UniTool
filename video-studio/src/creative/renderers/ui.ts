import { card, dot, label, ease, spring, clamp, line, type C } from "./common";
export function drawUI(
  c: C,
  id: string,
  t: number,
  color: string,
  text: string,
  px: number,
  py: number,
) {
  const alpha = c.globalAlpha;
  const phase = t % 5,
    p = ease(phase / 1.3),
    cursor = {
      x: 180 + px * 5 + Math.sin(t * 1.1) * 100,
      y: 100 + py * 3 + Math.cos(t) * 80,
    };
  if (id === "bento") {
    const boxes = [
      [100, 90, 340, 350],
      [460, 90, 390, 160],
      [460, 270, 185, 170],
      [665, 270, 185, 170],
    ];
    boxes.forEach((b, i) => {
      const s = clamp(spring(phase - i * 0.18));
      c.save();
      c.globalAlpha = alpha * clamp(s);
      c.translate(0, (1 - s) * 50);
      card(
        c,
        ...(b as [number, number, number, number]),
        i === 0 ? color : "#17303e",
      );
      label(
        c,
        i === 0 ? text : ["01", "02", "03"][i - 1],
        b[0] + b[2] / 2,
        b[1] + b[3] / 2,
        28,
        i === 0 ? "#09212b" : "#ffffff",
      );
      c.restore();
    });
  } else if (id === "island") {
    const expand = 0.5 - 0.5 * Math.cos(t * 1.5),
      w = 170 + 440 * expand,
      h = 70 + 100 * expand;
    card(c, 480 - w / 2, 220 - h / 2, w, h, "#061015", h / 2);
    dot(c, 480 - w / 2 + 40, 220, 9, color);
    if (expand > 0.35) label(c, text, 500, 220, 24);
    else label(c, "●", 490, 220, 20, color);
  } else if (id === "command") {
    const s = clamp(spring(phase));
    c.save();
    c.globalAlpha = alpha * clamp(s);
    c.translate(0, (1 - s) * -60);
    card(c, 180, 100, 600, 350, "#152535");
    card(c, 205, 120, 550, 65, "#233b4e", 12);
    label(c, `${text.slice(0, Math.floor(phase * 8))}▏`, 450, 153, 24);
    ["Search projects", "Recent elements", "Open settings"].forEach((v, i) => {
      card(
        c,
        205,
        205 + i * 65,
        550,
        52,
        i === Math.floor(phase) % 3 ? color : "#1b3040",
        8,
      );
      label(c, v, 480, 231 + i * 65, 22);
    });
    c.restore();
  } else if (id === "toasts") {
    for (let i = 0; i < 3; i++) {
      const a = clamp(spring(phase - i * 0.35)),
        exit = ease((phase - 3.6 - i * 0.15) / 0.6);
      c.save();
      c.globalAlpha = alpha * clamp(a * (1 - exit));
      const y = 140 + i * 96 + (1 - a) * 80;
      card(c, 250 + exit * 600, y, 480, 78, "#173140", 16);
      dot(c, 285 + exit * 600, y + 39, 12, color);
      label(
        c,
        i === 0 ? text : ["Saved locally", "Ready to share"][i - 1],
        510 + exit * 600,
        y + 39,
        23,
      );
      c.restore();
    }
  } else if (id === "skeleton") {
    card(c, 175, 100, 610, 340);
    for (let i = 0; i < 4; i++) {
      c.save();
      c.beginPath();
      c.roundRect(205, 130 + i * 70, i ? 430 - i * 40 : 550, 46, 9);
      c.clip();
      c.fillStyle = "#29404e";
      c.fillRect(190, 110, 590, 340);
      const x = ((t % 2) / 2) * 950 - 200,
        g = c.createLinearGradient(x, 0, x + 180, 0);
      g.addColorStop(0, "#ffffff00");
      g.addColorStop(0.5, "#ffffff44");
      g.addColorStop(1, "#ffffff00");
      c.fillStyle = g;
      c.fillRect(190, 110, 590, 340);
      c.restore();
    }
  } else if (id === "controls") {
    card(c, 180, 90, 600, 360);
    const on = Math.floor(t / 1.5) % 2,
      b = spring(t % 1.5);
    const v = on ? b : 1 - b;
    card(c, 240, 135, 150, 65, v > 0.5 ? color : "#456073", 32);
    dot(c, 273 + v * 84, 167, 25, "#fff");
    line(
      c,
      [
        [240, 280],
        [720, 280],
      ],
      "#345162",
      10,
    );
    line(
      c,
      [
        [240, 280],
        [240 + 480 * v, 280],
      ],
      color,
      10,
    );
    dot(c, 240 + 480 * v, 280, 17, "#fff");
    for (let i = 0; i < 3; i++) {
      card(
        c,
        240 + i * 160,
        345,
        150,
        65,
        i === Math.floor(t) % 3 ? color : "#28404f",
        15,
      );
      label(c, ["A", "B", "C"][i], 315 + i * 160, 377, 26);
    }
    label(c, text, 560, 165, 27);
  } else if (id === "cursor" || id === "magnet") {
    const dist = Math.hypot(cursor.x - 480, cursor.y - 270),
      hover = ease(1 - dist / 230),
      ox = id === "magnet" ? (cursor.x - 480) * hover * 0.35 : 0,
      oy = id === "magnet" ? (cursor.y - 270) * hover * 0.35 : 0;
    card(c, 330 + ox, 220 + oy, 300, 100, color, 28);
    label(c, text, 480 + ox, 270 + oy, 30, "#081b25");
    c.strokeStyle = "#ffffff";
    c.lineWidth = 2;
    c.beginPath();
    c.arc(cursor.x, cursor.y, 12 + hover * 30, 0, Math.PI * 2);
    c.stroke();
    dot(c, cursor.x, cursor.y, 3, "#fff");
  }
}
