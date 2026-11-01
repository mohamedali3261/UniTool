import { textCreativeIds } from "../creative/catalog";
import { drawCreative } from "../creative/render";
import { isBackgroundText } from "../composition/stacking";
import type { TextLayer } from "../types";
import { textLayout } from "./layout";
import { textAt } from "../animation/evaluate";
import { layerFrameAt } from "../animation/layerFrames";
export function drawTextLayers(
  ctx: CanvasRenderingContext2D,
  texts: TextLayer[],
  time: number,
  hidden = false,
) {
  const w = ctx.canvas.width,
    h = ctx.canvas.height;
  for (const t of [...texts]
    .sort((a, b) => Number(isBackgroundText(b)) - Number(isBackgroundText(a)))
    .filter((t) => !t.hidden && !hidden && time >= t.start && time < t.end)) {
    const animation = textAt(t, time),
      f = layerFrameAt(t, time);
    ctx.save();
    ctx.globalAlpha = animation.opacity * f.opacity * (t.opacity ?? 1);
    ctx.translate(
      (w * (t.x + f.x)) / 100,
      (h * (t.y + animation.y + f.y)) / 100,
    );
    ctx.rotate((((t.rotation || 0) + f.rotation) * Math.PI) / 180);
    ctx.scale(animation.scale * f.scaleX, animation.scale * f.scaleY);
    if (f.blur) ctx.filter = `blur(${(f.blur * w) / 960}px)`;
    const layout = textLayout(ctx, t, w);
    ctx.font = layout.font;
    ctx.textAlign = "center";
    ctx.direction = t.font === "mono" ? "ltr" : "rtl";
    ctx.textBaseline = "middle";
    ctx.fillStyle = t.color;
    ctx.shadowColor = "#000a";
    ctx.shadowBlur = t.box ? 0 : 8;
    if (t.creative && !textCreativeIds.has(t.creative.id)) {
      drawCreative(ctx, t, layout, animation.text, time);
      ctx.restore();
      continue;
    }
    if (t.box) {
      ctx.beginPath();
      if (t.box.points) {
        t.box.points.forEach((p, i) => {
          const x = (p.x * layout.width) / 2,
            y = (p.y * layout.height) / 2;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.closePath();
      } else {
        ctx.roundRect(
          -layout.width / 2,
          -layout.height / 2,
          layout.width,
          layout.height,
          Math.min(
            layout.width / 2,
            layout.height / 2,
            ((t.box.radius || 0) * w) / 960,
          ),
        );
      }
      if (t.background) {
        if (t.box.gradient) {
          const g = ctx.createLinearGradient(
            -layout.width / 2,
            -layout.height / 2,
            layout.width / 2,
            layout.height / 2,
          );
          g.addColorStop(0, t.background);
          g.addColorStop(1, t.box.gradient);
          ctx.fillStyle = g;
        } else ctx.fillStyle = t.background;
        ctx.fill();
      }
      if (t.box.borderWidth) {
        ctx.strokeStyle = t.box.borderColor || t.color;
        ctx.lineWidth = (t.box.borderWidth * w) / 960;
        ctx.stroke();
      }
      ctx.clip();
      ctx.fillStyle = t.color;
    }
    if (t.background && !t.box) {
      ctx.save();
      ctx.shadowBlur = 0;
      ctx.fillStyle = t.background;
      ctx.fillRect(
        -layout.width / 2 - layout.size * 0.25,
        -layout.size * 0.65,
        layout.width + layout.size * 0.5,
        layout.height + layout.size * 0.3,
      );
      ctx.restore();
    }
    if (t.creative) {
      drawCreative(ctx, t, layout, animation.text, time);
      ctx.restore();
      continue;
    }
    const lines = animation.text.split("\n");
    lines.forEach((line, i) => {
      const y = (i - (t.box ? (lines.length - 1) / 2 : 0)) * layout.size * 1.2;
      if (t.outline) {
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = Math.max(1, layout.size * 0.07);
        ctx.lineJoin = "round";
        ctx.strokeText(line, 0, y, t.box ? layout.width : w * 0.94);
      }
      ctx.fillText(line, 0, y, t.box ? layout.width : w * 0.94);
    });
    ctx.restore();
  }
}
