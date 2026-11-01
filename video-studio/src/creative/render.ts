import type { TextLayer } from "../types";
import { textCreativeIds } from "./catalog";
import { drawBackground } from "./renderers/backgrounds";
import { drawUI } from "./renderers/ui";
import { drawData } from "./renderers/data";
import { drawIcon } from "./renderers/icons";
import { drawTransition } from "./renderers/transitions";
import { drawThree } from "./renderers/three";
import { drawCreativeText } from "./renderers/text";
export function drawCreative(
  c: CanvasRenderingContext2D,
  t: TextLayer,
  layout: { width: number; height: number; size: number },
  text: string,
  time: number,
) {
  const v = t.creative!,
    local = Math.max(0, time - t.start) * v.speed;
  c.shadowBlur = 0;
  if (textCreativeIds.has(v.id)) {
    drawCreativeText(
      c,
      t,
      text,
      layout.size,
      Math.min(c.canvas.width * 0.94, layout.width * 1.2),
      local,
      (t.end - t.start) * v.speed,
    );
    return;
  }
  c.save();
  const fit = Math.min(layout.width / 960, layout.height / 540);
  c.scale(
    v.id === "three" ? fit : layout.width / 960,
    v.id === "three" ? fit : layout.height / 540,
  );
  c.translate(-480, -270);
  c.beginPath();
  c.rect(0, 0, 960, 540);
  c.clip();
  const color = t.color;
  if (["blob", "mesh", "grid", "aurora", "grain", "glass"].includes(v.id))
    drawBackground(
      c,
      v.id,
      local,
      color,
      text,
      v.pointerX,
      v.pointerY,
      v.strength,
    );
  else if (v.id === "three") drawThree(c, local, color);
  else if (
    [
      "bento",
      "island",
      "command",
      "toasts",
      "skeleton",
      "controls",
      "cursor",
      "magnet",
    ].includes(v.id)
  )
    drawUI(c, v.id, local, color, text, v.pointerX, v.pointerY);
  else if (["shared", "circle", "flip", "zoom", "liquid"].includes(v.id))
    drawTransition(c, v.id, local, color, text);
  else if (["line", "donut", "sparkline", "heatmap", "flow"].includes(v.id))
    drawData(c, v.id, local, color, text, v);
  else drawIcon(c, v.id, local, color, text);
  c.restore();
}
