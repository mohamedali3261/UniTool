import { card, label, clamp, ease, type C } from "./common";
/** Transition overlays are editable two-panel visual scenes, not an implicit splice of source clips. */
export function drawTransition(
  c: C,
  id: string,
  t: number,
  color: string,
  text: string,
) {
  const alpha = c.globalAlpha;
  const p = ease(clamp(t / 2.5));
  const scene = (next: boolean) => {
    c.fillStyle = next ? "#183e4b" : "#101c32";
    c.fillRect(0, 0, 960, 540);
    card(c, next ? 560 : 90, 130, 300, 280, next ? color : "#6a65c4", 32);
    label(c, next ? text : "SCENE A", 480, 270, 52);
  };
  scene(false);
  c.save();
  if (id === "circle") {
    c.beginPath();
    c.arc(480, 270, p * 560, 0, Math.PI * 2);
    c.clip();
    scene(true);
  } else if (id === "liquid") {
    c.beginPath();
    c.moveTo(0, 0);
    const base = -120 + p * 1200;
    for (let y = 0; y <= 540; y += 10)
      c.lineTo(
        base + Math.sin(y * 0.018 + t * 3) * 55 * Math.sin(p * Math.PI),
        y,
      );
    c.lineTo(0, 540);
    c.closePath();
    c.clip();
    scene(true);
  } else if (id === "flip") {
    if (p > 0.5) scene(true);
    const w = 960 * Math.abs(Math.cos(p * Math.PI));
    c.translate(p < 0.5 ? 0 : 960 - w, 0);
    c.scale(w / 960, 1);
    scene(p > 0.5);
    const g = c.createLinearGradient(0, 0, 960, 0);
    g.addColorStop(0, "#ffffff00");
    g.addColorStop(1, "#00000099");
    c.fillStyle = g;
    c.fillRect(0, 0, 960, 540);
  } else if (id === "zoom") {
    const s = 1 + p * 9;
    c.translate(480, 270);
    c.scale(s, s);
    c.translate(-480, -270);
    c.globalAlpha = alpha * clamp(1 - p);
    scene(false);
    c.restore();
    c.save();
    c.globalAlpha = alpha * clamp(p);
    scene(true);
  } else if (id === "shared") {
    const x = 90 * (1 - p),
      y = 130 * (1 - p),
      w = 300 + 660 * p,
      h = 280 + 260 * p;
    c.beginPath();
    c.roundRect(x, y, w, h, 32 * (1 - p));
    c.clip();
    scene(true);
  }
  c.restore();
}
