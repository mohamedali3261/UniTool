import type { TextLayer } from "../types";
export const textFonts = {
  sans: "Arial, sans-serif",
  serif: "Georgia, serif",
  mono: "monospace",
};
/** Shared font and bounds, so hit testing and export use identical measurements. */
export function textLayout(
  ctx: CanvasRenderingContext2D,
  t: TextLayer,
  w: number,
) {
  const size = (t.size * w) / 960;
  const font = `${t.bold === false ? 400 : 700} ${size}px ${textFonts[t.font || "sans"]}`;
  ctx.save();
  ctx.font = font;
  const lines = t.text.split("\n");
  const width = Math.min(
    w * 0.94,
    Math.max(size, ...lines.map((line) => ctx.measureText(line).width)),
  );
  ctx.restore();
  return {
    font,
    size,
    lines,
    width: t.box ? t.box.width*w/960 : width,
    height: t.box ? t.box.height*w/960 : size + (lines.length - 1) * size * 1.2,
    offsetY: t.box ? 0 : (lines.length - 1) * size * 0.6,
  };
}
